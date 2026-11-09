"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      // min-w-0: this is a flex container, and TabsContent below is a flex
      // item of it — flex items default to min-width:auto (never narrower
      // than their content), so a wide table inside one tab's content would
      // otherwise force this whole component wider than the viewport. The
      // nearest scrolling ancestor (the dashboard's <main>) would then
      // scroll the ENTIRE tab panel sideways — header, search box, buttons
      // and all — instead of just the table's own internal horizontal
      // scrollbar handling its own overflow.
      className={cn("flex min-w-0 flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    // flex-nowrap + overflow-x-auto, not flex-wrap: the active trigger's
    // -mb-px seam (see TabsTrigger's comment) only lines up against the
    // border below when it sits on the row's one and only line — wrapping
    // to a second line breaks that seam visibly. A row that doesn't fit
    // scrolls horizontally instead, which never has that problem.
    <TabsPrimitive.List
      data-slot="tabs-list"
      // table-hscroll (not catalog-scrollbar), same as the shared Table
      // component's horizontal-overflow scrollbar — catalog-scrollbar is
      // tinted blue for the public/auth theme; this is an admin surface,
      // and table-hscroll is already the correct black-tinted thin bar for
      // a horizontally-scrolling row.
      className={cn("table-hscroll flex flex-nowrap items-end gap-1 overflow-x-auto border-b border-input", className)}
      {...props}
    />
  )
}

// A real "folder tab" — the active trigger's border and background merge
// seamlessly into the top edge of the content below it (via -mb-px pulling
// it down over the shared border line), so the content visibly reads as
// belonging to that tab rather than floating independently under a row of
// pills. That seam is the only connection — the content itself is NOT a
// card: no side/bottom border, no box background, no padding box. It's
// just page content that happens to start right under the open tab.
// Inactive tabs are flat, borderless labels sitting on the shared line.
// No focus ring on keyboard nav either — matches this app's system-wide
// "no ring anywhere" rule, extended here to the tab strip specifically.
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px inline-flex h-9 shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 border-transparent px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:border-input data-[state=active]:bg-background data-[state=active]:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      // min-w-0 — see the comment on Tabs above; this is the flex item that
      // actually holds each tab's (potentially very wide) content.
      className={cn("min-w-0 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
