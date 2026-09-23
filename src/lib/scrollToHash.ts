import type { MouseEvent } from "react";

/**
 * Click handler for a same-page `/#section`-style link: smooth-scrolls to
 * the target when already on that page, and lets the click through as a
 * normal navigation otherwise (the browser jumps to the hash, instantly,
 * once the destination page loads — see globals.css for why this is
 * deliberately not animated via a global scroll-behavior: smooth instead).
 */
export function scrollToHash(id: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== "/") return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}
