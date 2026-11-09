import { describe, expect, it } from "vitest";
import { withEnrollIntent } from "./enrollIntent";

const params = (query: string) => new URLSearchParams(query);

describe("withEnrollIntent", () => {
  it("carries both enroll intents onto the next step", () => {
    expect(withEnrollIntent("/dashboard", params("enrollCourse=i-1&requestCourse=c-2"))).toBe(
      "/dashboard?enrollCourse=i-1&requestCourse=c-2",
    );
  });

  it("keeps the query the path already has", () => {
    expect(withEnrollIntent("/verify-email?email=a%40b.lk", params("requestCourse=c-2"))).toBe(
      "/verify-email?email=a%40b.lk&requestCourse=c-2",
    );
  });

  it("copies only the two known keys, never a redirect target", () => {
    expect(withEnrollIntent("/dashboard", params("next=https://evil.example&redirect=//evil.example"))).toBe("/dashboard");
  });

  it("can't be turned into an off-site URL by the source", () => {
    const result = withEnrollIntent("/sign-in", params("enrollCourse=//evil.example/x"));
    expect(result.startsWith("/sign-in?")).toBe(true);
    expect(result).toBe("/sign-in?enrollCourse=%2F%2Fevil.example%2Fx");
  });
});
