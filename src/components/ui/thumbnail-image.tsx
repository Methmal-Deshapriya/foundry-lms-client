"use client";

import { useState } from "react";
import { ThumbnailFallback } from "./thumbnail-fallback";

/**
 * Renders an R2-backed thumbnail (course/project/service image) with a
 * guaranteed graceful fallback — used everywhere a Course.thumbnailUrl or
 * StudentProject.thumbnailUrl gets displayed. Two distinct failure modes,
 * both handled:
 *  - No URL at all (never uploaded) — renders the fallback immediately,
 *    without ever attempting a request.
 *  - A URL exists but fails to load at runtime (e.g. an R2 outage, a
 *    deleted object) — the <img>'s onError swaps to the same fallback, so a
 *    real image doesn't silently regress to a broken-image icon later.
 */
export function ThumbnailImage({
  src,
  alt,
  label,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  label: string;
  className?: string;
}) {
  const [trackedSrc, setTrackedSrc] = useState(src);
  const [errored, setErrored] = useState(false);
  // A different service/course/project can reuse this component instance
  // (e.g. list virtualization) with a new src — reset so a previous load
  // failure doesn't permanently hide an otherwise-good image. Adjusting
  // state during render (not in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (trackedSrc !== src) {
    setTrackedSrc(src);
    setErrored(false);
  }

  if (!src || errored) return <ThumbnailFallback label={label} className={className} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary admin-supplied R2 URL; next/image's domain allowlist would need constant upkeep
    <img src={src} alt={alt} className={className} onError={() => setErrored(true)} />
  );
}
