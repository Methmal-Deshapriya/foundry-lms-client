import { describe, expect, it } from "vitest";
import { linkTarget } from "./links";

describe("admin link targets (M09-07)", () => {
  it("accepts in-app paths and https links", () => {
    expect(linkTarget("/explore")).toBe("internal");
    expect(linkTarget("/bootcamps/ai-ml?intake=1#fees")).toBe("internal");
    expect(linkTarget("https://wa.me/94723622112")).toBe("external");
  });

  it("refuses paths that browsers open as another site", () => {
    expect(linkTarget("//evil.com")).toBeNull();
    expect(linkTarget("/\\evil.com")).toBeNull();
    expect(linkTarget("/ok\\..\\evil")).toBeNull();
  });

  it("refuses other schemes", () => {
    expect(linkTarget("http://example.com")).toBeNull();
    expect(linkTarget("javascript:alert(1)")).toBeNull();
    expect(linkTarget("")).toBeNull();
  });
});
