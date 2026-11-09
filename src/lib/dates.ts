import { format } from "date-fns";

// Turning a picked calendar day ("YYYY-MM-DD", from a date picker) into the
// instant the API stores. The browser runs on Sri Lanka time, so these local
// conversions line up with the server's Asia/Colombo days. Never send a bare
// "YYYY-MM-DD" or an offset-less "…T00:00:00": the server would read it as
// UTC, 05:30 off (code review M03-02/07/11/13).

/** Today's local calendar day, "YYYY-MM-DD". */
export const todayDay = () => format(new Date(), "yyyy-MM-dd");

/** The local calendar day of an instant, "YYYY-MM-DD". */
export const dayOf = (instant: string | Date) => format(new Date(instant), "yyyy-MM-dd");

/**
 * When something happened on `day`: right now if it's today (so it can
 * never be "in the future"), otherwise midday that day, which stays on the
 * same date in every timezone the academy deals with.
 */
export function dayToInstant(day: string) {
  return day === todayDay() ? new Date().toISOString() : new Date(`${day}T12:00:00`).toISOString();
}

/** The first and last instant of a local calendar day, for date-range filters. */
export const dayStartIso = (day: string) => new Date(`${day}T00:00:00`).toISOString();
export const dayEndIso = (day: string) => new Date(`${day}T23:59:59.999`).toISOString();

// ------------------------------------------------------------ time zones
// Intakes run on their own time zone (Asia/Colombo by default), which may
// not be the admin's computer clock (code review M07-05).

export const DEFAULT_INTAKE_TIME_ZONE = "Asia/Colombo";

/** Minutes the zone is ahead of UTC at `instant` (e.g. +330 for Colombo). */
function zoneOffsetMinutes(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

/**
 * The instant at which the wall clock in `timeZone` shows the given date and
 * time — e.g. 9:00 on 5 Oct in Colombo, whatever the browser's own zone.
 */
export function wallTimeInZone(year: number, monthIndex: number, day: number, hours: number, minutes: number, timeZone: string) {
  const guess = Date.UTC(year, monthIndex, day, hours, minutes);
  const offset = zoneOffsetMinutes(new Date(guess), timeZone);
  return new Date(guess - offset * 60_000);
}

/** "Oct 5, 2026 · 9:00 AM" as seen in `timeZone`. */
export function formatInZone(instant: string | Date, timeZone: string) {
  const date = new Date(instant);
  const day = new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

/**
 * "Oct 5, 2026" on the Sri Lanka calendar — for certificates, which are
 * issued in Colombo and must show the same date to every viewer
 * (code review M08-12).
 */
export const formatColomboDay = (instant: string | Date) =>
  new Intl.DateTimeFormat("en-US", { timeZone: DEFAULT_INTAKE_TIME_ZONE, month: "short", day: "numeric", year: "numeric" }).format(new Date(instant));

/** Year and month (1-12) of `instant` on the Sri Lanka calendar. */
export function colomboYearMonth(instant: string | Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: DEFAULT_INTAKE_TIME_ZONE, year: "numeric", month: "numeric" })
      .formatToParts(new Date(instant))
      .map((part) => [part.type, part.value]),
  );
  return { year: Number(parts.year), month: Number(parts.month) };
}

/** A short label for the zone, e.g. "Sri Lanka time" for Asia/Colombo. */
export const zoneLabel = (timeZone: string) => (timeZone === "Asia/Colombo" ? "Sri Lanka time" : timeZone);
