// The "Signal" palette (see scratch/chart-palettes.html) — blue, green,
// amber and violet as the categorical slots, with red reserved only for the
// one negative state in each set (CANCELLED/REVOKED/REJECTED). Every chart
// in the app draws from here so a status keeps the same color wherever it
// appears — Admin dashboard, Service/Course/Intake summaries, student
// dashboard. Green↔amber sits in the CVD 6–8 ΔE floor band, which is legal
// only with secondary encoding: every chart using both carries a legend.
export const SIGNAL = {
  BLUE: "#2563EB",
  GREEN: "#16A34A",
  AMBER: "#D97706",
  VIOLET: "#7C3AED",
  RED: "#E91717",
} as const;

// Neutral remainder / "not a real category" fill (zinc-200).
export const NEUTRAL_COLOR = "#E4E4E7";

// Single-series magnitude (trend bars/areas, meters) — the palette's primary.
export const TREND_COLOR = SIGNAL.BLUE;

// Sequential ramp for single-hue magnitude maps (light → dark blue).
export const SEQUENTIAL_BLUE = ["#BFDBFE", "#60A5FA", "#2563EB", "#1E3A8A"] as const;

export const ENROLLMENT_STATUS_COLORS = {
  ACTIVE: SIGNAL.BLUE,
  COMPLETED: SIGNAL.GREEN,
  CANCELLED: SIGNAL.RED,
} as const;

export const CERTIFICATE_STATUS_COLORS = {
  ISSUED: SIGNAL.BLUE,
  REVOKED: SIGNAL.RED,
} as const;

// Issued vs. still-outstanding among certificate-eligible enrollments — a
// completion ratio, not a status set, so the remainder is neutral grey
// rather than CERTIFICATE_STATUS_COLORS's REVOKED red (revoked isn't the
// same thing as "not yet issued").
export const CERTIFICATE_ISSUANCE_COLORS = {
  ISSUED: SIGNAL.BLUE,
  NOT_ISSUED: "#D4D4D8",
} as const;

export const PROJECT_STATUS_COLORS = {
  PENDING: SIGNAL.AMBER,
  APPROVED: SIGNAL.GREEN,
  REJECTED: SIGNAL.RED,
} as const;

// Collected vs. still-outstanding — "partial" is amber everywhere it
// appears (here and in PAYMENT_TYPE_COLORS) so the two cards read alike.
export const PAYMENT_STATUS_COLORS = {
  COMPLETED: SIGNAL.BLUE,
  PARTIAL: SIGNAL.AMBER,
} as const;

// Payment *type* (how a paid enrollment was settled), distinct from
// PAYMENT_STATUS_COLORS above (whether it's fully settled yet) — all three
// are "money received" outcomes, none negative, so no red here.
export const PAYMENT_TYPE_COLORS = {
  FULL: SIGNAL.BLUE,
  PARTIAL: SIGNAL.AMBER,
  TOP_UP: SIGNAL.VIOLET,
} as const;

// Categorical slots for admin-created entities (services). Ordered so green
// and amber — the closest pair for colour-blind readers — never touch around
// the pie.
export const CATEGORICAL_COLORS = [SIGNAL.BLUE, SIGNAL.GREEN, SIGNAL.VIOLET, SIGNAL.AMBER] as const;
