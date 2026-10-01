import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
import { revalidateTag } from "next/cache";
import { POST } from "./route";

const call = (authorization?: string) =>
  POST(new Request("http://localhost/api/internal/catalog/revalidate", { method: "POST", headers: authorization ? { authorization } : {} }));

// The API calls this after catalog edits; nobody else may expire the cache
// (code review M06-06/M06-16).
describe("catalog revalidation route", () => {
  const previous = process.env.CATALOG_REVALIDATION_SECRET;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CATALOG_REVALIDATION_SECRET = "a-long-random-revalidation-secret";
  });
  afterEach(() => {
    process.env.CATALOG_REVALIDATION_SECRET = previous;
  });

  it("answers 503 when the secret isn't configured", async () => {
    delete process.env.CATALOG_REVALIDATION_SECRET;
    expect((await call("Bearer anything")).status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it.each([undefined, "Bearer wrong", "a-long-random-revalidation-secret"])("answers 401 to %s", async (header) => {
    expect((await call(header)).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("expires the public catalog with the right secret", async () => {
    const response = await call("Bearer a-long-random-revalidation-secret");
    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("public-catalog", { expire: 0 });
  });
});
