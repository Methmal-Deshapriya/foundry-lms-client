"use client";

import { Children, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marquee
 *
 * An infinitely-looping horizontal row, following the same pattern used by
 * the well-known shadcn-ecosystem Marquee (magicui.design) — no animation
 * library needed, just a duplicated track and a CSS keyframe (see
 * globals.css). Pauses on hover/focus via `group-hover`, scoped per
 * instance so hovering one row never affects another.
 */
export function Marquee({
  children,
  reverse = false,
  durationSeconds = 45,
  gap = "1.25rem",
  className,
}: {
  children: ReactNode;
  /** Plays the same track backwards — "left to right" instead of "right to left". */
  reverse?: boolean;
  durationSeconds?: number;
  gap?: string;
  className?: string;
}) {
  const items = Children.toArray(children);

  return (
    <div
      className={cn(
        "group flex w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]",
        className,
      )}
      style={{ gap, ["--marquee-gap" as string]: gap }}
    >
      {[0, 1].map((setIndex) => (
        <div
          key={setIndex}
          aria-hidden={setIndex === 1}
          className={cn(
            "flex shrink-0 items-stretch",
            reverse ? "animate-marquee-reverse" : "animate-marquee",
            "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
          )}
          style={{ gap, animationDuration: `${durationSeconds}s` } as CSSProperties}
        >
          {items}
        </div>
      ))}
    </div>
  );
}

export default Marquee;
