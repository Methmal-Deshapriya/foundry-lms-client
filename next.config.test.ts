import { describe, expect, it } from "vitest";
import {
  createContentSecurityPolicy,
  readClientBuildConfig,
} from "./next.config";

describe("production client configuration", () => {
  it("uses NEXT_PUBLIC_API_BASE_URL in connect-src", () => {
    const config = readClientBuildConfig({
      NODE_ENV: "production",
      NEXT_PUBLIC_API_BASE_URL: "https://api.example.test/api/v1",
      CATALOG_REVALIDATION_SECRET: "test-secret",
    });

    expect(
      createContentSecurityPolicy(config.apiOrigin, { NODE_ENV: "production" }),
    ).toContain("connect-src 'self' https://api.example.test");
    expect(
      createContentSecurityPolicy(config.apiOrigin, { NODE_ENV: "production" }),
    ).not.toContain("img-src 'self' data: blob: https:");
  });

  it("rejects missing production deployment values", () => {
    expect(() => readClientBuildConfig({ NODE_ENV: "production" })).toThrow(
      "NEXT_PUBLIC_API_BASE_URL is required in production.",
    );
  });

  it("rejects an insecure production API origin", () => {
    expect(() =>
      readClientBuildConfig({
        NODE_ENV: "production",
        NEXT_PUBLIC_API_BASE_URL: "http://api.example.test/api/v1",
        CATALOG_REVALIDATION_SECRET: "test-secret",
      }),
    ).toThrow("must use HTTPS");
  });

  it("allows the R2 upload origin in connect-src when NEXT_PUBLIC_R2_ACCOUNT_ID is set", () => {
    expect(
      createContentSecurityPolicy("https://api.example.test", {
        NODE_ENV: "production",
        NEXT_PUBLIC_R2_ACCOUNT_ID: "abc123",
      }),
    ).toContain(
      "connect-src 'self' https://api.example.test https://*.abc123.r2.cloudflarestorage.com",
    );
  });

  it("omits the R2 upload origin from connect-src when NEXT_PUBLIC_R2_ACCOUNT_ID is unset", () => {
    expect(
      createContentSecurityPolicy("https://api.example.test", { NODE_ENV: "production" }),
    ).toContain("connect-src 'self' https://api.example.test;");
  });
});
