import React from "react";

/**
 * PageSlide
 *
 * The shared shell for every non-home public page: consistent page padding
 * and a minimum full-height white background, in normal document flow.
 * Breadcrumbs and the floating "Back" button this used to carry were both
 * dropped once the site got a persistent top navbar (MarketingNavbar) —
 * that's the site's one, consistent way to get around now.
 */
export function PageSlide({
  children,
  background,
}: {
  children: React.ReactNode;
  background?: string;
}) {
  return (
    <div className="relative min-h-dvh w-full bg-white" style={background ? { background } : undefined}>
      <div className="px-3 pt-10 pb-16 sm:px-6 sm:pt-14">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
