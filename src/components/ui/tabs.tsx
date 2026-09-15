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
      className={cn("flex flex-col gap-4", className)}
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
      className={cn("catalog-scrollbar flex flex-nowrap items-end gap-1 overflow-x-auto border-b border-input", className)}
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
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
