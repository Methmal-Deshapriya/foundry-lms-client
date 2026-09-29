"use client";

import { useState } from "react";

/**
 * Tracks which of up to two image sources should currently be rendered —
 * `primary` (an R2-backed URL) first, then `fallback` (a locally bundled
 * asset) if `primary` is missing or fails to load at runtime (e.g. an R2
 * outage), advancing again if `fallback` itself somehow fails too. Returns
 * null once both are exhausted, so the caller can render its own
 * last-resort placeholder (see ThumbnailFallback).
 */
export function useFallbackImage(primary: string | null, fallback?: string) {
  const [tracked, setTracked] = useState({ primary, fallback });
  const [failedPrimary, setFailedPrimary] = useState(false);
  const [failedFallback, setFailedFallback] = useState(false);

  // Adjusting state during render (not in an effect) when a prop actually
  // changes — the documented React pattern for resetting derived state
  // without an extra render+effect round trip. See
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (tracked.primary !== primary || tracked.fallback !== fallback) {
    setTracked({ primary, fallback });
    setFailedPrimary(false);
    setFailedFallback(false);
  }

  if (primary && !failedPrimary) {
    return { src: primary, onError: () => setFailedPrimary(true) };
  }
  if (fallback && !failedFallback) {
    return { src: fallback, onError: () => setFailedFallback(true) };
  }
  return null;
}
