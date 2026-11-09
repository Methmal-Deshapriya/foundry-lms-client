import { describe, expect, it } from "vitest";
import { colomboYearMonth, formatColomboDay, formatInZone, wallTimeInZone } from "./dates";

describe("intake time zone (M07-05)", () => {
  it("reads 9:00 as Sri Lanka time whatever the computer's zone", () => {
    expect(wallTimeInZone(2026, 9, 5, 9, 0, "Asia/Colombo").toISOString()).toBe("2026-10-05T03:30:00.000Z");
  });
  it("shows an instant on the Colombo clock", () => {
    expect(formatInZone("2026-10-05T03:30:00.000Z", "Asia/Colombo")).toBe("Oct 5, 2026 · 9:00 AM");
  });
  it("handles midnight crossing the UTC day", () => {
    expect(wallTimeInZone(2026, 0, 1, 2, 0, "Asia/Colombo").toISOString()).toBe("2025-12-31T20:30:00.000Z");
  });
});

describe("certificate dates (M08-12)", () => {
  // 20:00 UTC on 31 Dec is already 01:30 on 1 Jan in Colombo.
  const newYear = "2025-12-31T20:00:00.000Z";
  it("shows the Sri Lanka calendar day", () => {
    expect(formatColomboDay(newYear)).toBe("Jan 1, 2026");
  });
  it("gives LinkedIn the Sri Lanka year and month", () => {
    expect(colomboYearMonth(newYear)).toEqual({ year: 2026, month: 1 });
  });
});
