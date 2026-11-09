import { describe, expect, it } from "vitest";
import { getAccessMessage } from "./enrollmentAccess";

const enrollment = (overrides: Record<string, unknown> = {}) =>
  ({ status: "ACTIVE", source: "ADMIN", paymentStatus: "COMPLETED", course: { intakeStatus: "OPEN_ACTIVE" }, ...overrides }) as Parameters<typeof getAccessMessage>[0];

describe("classroom access on My Courses", () => {
  it("opens for a fully paid student", () => {
    expect(getAccessMessage(enrollment())).toBeNull();
  });

  it("opens for a student who paid half, like the server allows (M05-01)", () => {
    expect(getAccessMessage(enrollment({ paymentStatus: "PARTIAL" }))).toBeNull();
  });

  it("stays locked while nothing has been paid", () => {
    expect(getAccessMessage(enrollment({ paymentStatus: "PENDING" }))).toMatch(/payment/);
  });

  it("is closed for a cancelled enrollment", () => {
    expect(getAccessMessage(enrollment({ status: "CANCELLED" }))).toMatch(/cancelled/);
  });

  it("opens for a free self-enrolled learner", () => {
    expect(getAccessMessage(enrollment({ source: "SELF", paymentStatus: "NOT_REQUIRED" }))).toBeNull();
  });

  it("is closed while the intake isn't running", () => {
    expect(getAccessMessage(enrollment({ course: { intakeStatus: "DRAFT" } }))).toMatch(/not currently available/);
  });
});
