import type { PublicServiceConfig } from "./types";

/**
 * The one accent every Level-2/3/4 public page shares — house black
 * (matching the home page's buttons/icon tiles), not a per-service color.
 * Red (#E91717) is reserved for the small eyebrow/highlight touches used
 * site-wide and is applied directly where needed rather than through this
 * config.
 */
export const SERVICE_ACCENT: PublicServiceConfig["accent"] = {
  text: "text-[#191919]",
  softBg: "bg-zinc-100",
  button: "bg-[#191919] hover:bg-[#27272A]",
};
