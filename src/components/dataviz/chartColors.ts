// The "Monochrome + Red" palette — a dark-zinc-to-grey scale for every
// positive/neutral state, with red reserved only for the one negative state
// in each set (CANCELLED/REVOKED/REJECTED). Originally picked for the admin
// dashboard's status donuts (AdminDashboard.tsx); promoted here so the
// Service/Course/Intake level summaries can reuse the exact same identity
// per status instead of inventing their own colors — see the 2026-09-24
// hierarchical admin summaries plan.
export const TREND_COLOR = "#27272A"; // zinc-800 — the palette's primary

export const ENROLLMENT_STATUS_COLORS = {
  ACTIVE: "#27272A",
  COMPLETED: "#71717A",
  CANCELLED: "#E91717",
} as const;

export const CERTIFICATE_STATUS_COLORS = {
  ISSUED: "#27272A",
  REVOKED: "#E91717",
} as const;

// Issued vs. still-outstanding among certificate-eligible enrollments — a
// completion ratio, not a status set, so it gets its own dark/light pair
// rather than reusing CERTIFICATE_STATUS_COLORS's ISSUED/REVOKED (revoked
// isn't the same thing as "not yet issued").
export const CERTIFICATE_ISSUANCE_COLORS = {
  ISSUED: "#27272A",
  NOT_ISSUED: "#D4D4D8",
} as const;

export const PROJECT_STATUS_COLORS = {
  PENDING: "#71717A",
  APPROVED: "#27272A",
  REJECTED: "#E91717",
} as const;

export const PAYMENT_STATUS_COLORS = {
  COMPLETED: "#27272A",
  PARTIAL: "#71717A",
} as const;

// Payment *type* (how a paid enrollment was settled), distinct from
// PAYMENT_STATUS_COLORS above (whether it's fully settled yet) — all three
// are "money received" outcomes, none negative, so this continues the same
// grey scale one step further rather than introducing red anywhere.
export const PAYMENT_TYPE_COLORS = {
  FULL: "#27272A",
  PARTIAL: "#71717A",
  TOP_UP: "#A1A1AA",
} as const;
