import { describe, expect, it } from "vitest";
import { escapeCell, toCsv } from "./csv";

describe("CSV export cells", () => {
  it("keeps negative amounts numeric so =SUM() includes refunds (M03-06)", () => {
    expect(escapeCell(-5000)).toBe("-5000");
    expect(escapeCell("-5000.00")).toBe("-5000.00");
    expect(escapeCell(0)).toBe("0");
  });

  it("still neutralises text that a spreadsheet would run as a formula", () => {
    expect(escapeCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(escapeCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeCell("-1+1")).toBe("'-1+1");
    expect(escapeCell("+94 77 123 4567")).toBe("'+94 77 123 4567");
  });

  it("quotes commas and newlines", () => {
    expect(toCsv([["a,b", "line\nbreak", 12.5]])).toBe("\"a,b\",\"line\nbreak\",12.5");
  });
});
