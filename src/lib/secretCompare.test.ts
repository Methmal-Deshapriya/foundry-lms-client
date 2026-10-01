import { describe, expect, it } from "vitest";
import { hasBearerSecret } from "./secretCompare";

describe("revalidation secret check (M06-06)", () => {
  const secret = "a-long-random-revalidation-secret";
  it("accepts the exact bearer secret", () => {
    expect(hasBearerSecret(`Bearer ${secret}`, secret)).toBe(true);
  });
  it.each([null, "", secret, `Bearer ${secret}x`, `Bearer ${secret.slice(0, -1)}`, `bearer ${secret}`])("refuses %s", (header) => {
    expect(hasBearerSecret(header, secret)).toBe(false);
  });
});
