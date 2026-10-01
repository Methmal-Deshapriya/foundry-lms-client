"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromotionTheme, PublicPromotion } from "../notificationsTypes";

// Preset themes: admins choose one, never raw colours or HTML, so every
// banner stays on-brand.
const THEMES: Record<PromotionTheme, { shell: string; badge: string; button: string; muted: string; close: string }> = {
  DARK: {
    shell: "bg-[#191919] text-white border-white/10",
    badge: "bg-[#E91717] text-white",
    button: "bg-white text-[#191919] hover:bg-zinc-200",
    muted: "text-white/70",
    close: "text-white/60 hover:bg-white/10 hover:text-white",
  },
  LIGHT: {
    shell: "bg-white text-[#191919] border-zinc-200",
    badge: "bg-[#191919] text-white",
    button: "bg-[#191919] text-white hover:bg-[#27272A]",
    muted: "text-[#71717A]",
    close: "text-[#71717A] hover:bg-zinc-100 hover:text-[#191919]",
  },
  RED: {
    shell: "bg-[#E91717] text-white border-white/10",
    badge: "bg-white text-[#E91717]",
    button: "bg-[#191919] text-white hover:bg-[#27272A]",
    muted: "text-white/80",
    close: "text-white/70 hover:bg-white/15 hover:text-white",
  },
};

function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [enabled]);
  return now;
}

function Countdown({ endsAt, className }: { endsAt: string; className: string }) {
  const now = useNow(true);
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const parts = days > 0 ? [`${days}d`, `${hours}h`, `${minutes}m`] : [`${hours}h`, `${minutes}m`, `${seconds}s`];
  return (
    <span className={cn("font-alt text-xs font-semibold tabular-nums", className)} aria-label={`Ends in ${parts.join(" ")}`}>
      Ends in {parts.join(" ")}
    </span>
  );
}

/**
 * The floating promotion banner. Used both on the landing page and as the
 * live preview in the admin editor (`preview` disables links and dismissal).
 */
export function PromotionBannerView({
  promotion,
  onClose,
  preview = false,
}: {
  promotion: Omit<PublicPromotion, "id" | "updatedAt"> & { id?: string };
  onClose?: () => void;
  preview?: boolean;
}) {
  const theme = THEMES[promotion.theme];
  const cta =
    promotion.ctaLabel && promotion.ctaUrl ? (
      <span className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 font-alt text-sm font-semibold transition-colors", theme.button)}>
        {promotion.ctaLabel}
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    ) : null;

  return (
    <div className={cn("pointer-events-auto flex w-full items-center gap-3 rounded-2xl border p-2.5 pr-2 shadow-xl sm:gap-4 sm:p-3", theme.shell)}>
      {promotion.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 public URL, same reasoning as ThumbnailImage
        <img src={promotion.imageUrl} alt="" className="hidden size-12 shrink-0 rounded-xl object-cover sm:block" />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {promotion.badge ? (
            <span className={cn("rounded-full px-2 py-0.5 font-alt text-[10px] font-bold tracking-wide uppercase", theme.badge)}>{promotion.badge}</span>
          ) : null}
          <p className="font-sans text-sm font-bold sm:text-base">{promotion.headline}</p>
          {promotion.showCountdown && promotion.endsAt ? <Countdown endsAt={promotion.endsAt} className={theme.muted} /> : null}
        </div>
        {promotion.message ? <p className={cn("mt-0.5 line-clamp-2 font-alt text-xs sm:text-sm", theme.muted)}>{promotion.message}</p> : null}
      </div>
      {cta ? (
        preview || !promotion.ctaUrl ? (
          cta
        ) : /^https?:/.test(promotion.ctaUrl) ? (
          <a href={promotion.ctaUrl} target="_blank" rel="noopener noreferrer">
            {cta}
          </a>
        ) : (
          <Link href={promotion.ctaUrl}>{cta}</Link>
        )
      ) : null}
      <button
        type="button"
        onClick={onClose}
        disabled={preview}
        aria-label="Dismiss this offer"
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-full transition-colors", theme.close)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

const DISMISSED_KEY = "foundry:dismissed-promotion";
const subscribeNoop = () => () => {};

function readDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

/**
 * Landing page: floats the live promotion at the top of the screen. A
 * visitor who closes it won't see *that version* again — it's remembered on
 * their own device (free), and an edited or new promotion shows again.
 */
export function FloatingPromotionBanner({ promotion }: { promotion: PublicPromotion | null | undefined }) {
  const version = promotion ? `${promotion.id}:${promotion.updatedAt}` : null;
  const stored = useSyncExternalStore(subscribeNoop, readDismissed, () => null);
  const [dismissedNow, setDismissedNow] = useState<string | null>(null);
  if (!promotion || !version || stored === version || dismissedNow === version) return null;
  // Promotions past their end date are already filtered out by the server.

  const close = () => {
    setDismissedNow(version);
    try {
      window.localStorage.setItem(DISMISSED_KEY, version);
    } catch {
      // Private mode etc.: it just won't be remembered next visit.
    }
  };

  return (
    // Sticky, not fixed: at the top of the page it takes its own space (so it
    // never covers the hero heading on a phone), then keeps floating under
    // the navbar as the visitor scrolls.
    <div className="pointer-events-none sticky top-[4.5rem] z-40 px-3 pt-3 sm:px-6" role="region" aria-label="Current offer">
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-top-2 duration-500">
        <PromotionBannerView promotion={promotion} onClose={close} />
      </div>
    </div>
  );
}
