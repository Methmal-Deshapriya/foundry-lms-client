import type { NextConfig } from "next";

const DEFAULT_DEVELOPMENT_API_URL = "http://localhost:5000/api/v1";

export function readClientBuildConfig(environment = process.env) {
  const configuredApiUrl = environment.NEXT_PUBLIC_API_BASE_URL?.trim();
  const apiUrl = configuredApiUrl || DEFAULT_DEVELOPMENT_API_URL;

  // A relative value (e.g. "/api/v1") means the browser reaches the API
  // through this app's own origin instead of a separate one — the dev-only
  // rewrite below proxies it to the real API server. This lets a tunneled
  // frontend (shared with someone for a manual QA pass) reach the API
  // without a second public tunnel or a cross-site cookie problem. Never
  // valid in production, where the API is always its own real, absolute,
  // separately-hosted URL.
  if (apiUrl.startsWith("/")) {
    if (environment.NODE_ENV === "production") {
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL in production.",
      );
    }
    return { apiUrl, apiOrigin: "" };
  }

  let parsedApiUrl: URL;
  try {
    parsedApiUrl = new URL(apiUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be a valid absolute HTTP(S) URL.",
    );
  }

  if (!new Set(["http:", "https:"]).has(parsedApiUrl.protocol)) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must be a valid absolute HTTP(S) URL.",
    );
  }

  if (environment.NODE_ENV === "production") {
    if (!configuredApiUrl) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production.");
    }
    if (!environment.CATALOG_REVALIDATION_SECRET?.trim()) {
      throw new Error("CATALOG_REVALIDATION_SECRET is required in production.");
    }
    const isLoopback = new Set(["localhost", "127.0.0.1", "::1"]).has(
      parsedApiUrl.hostname,
    );
    if (parsedApiUrl.protocol !== "https:" && !isLoopback) {
      throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTPS in production.");
    }
  }

  return { apiUrl: parsedApiUrl.toString(), apiOrigin: parsedApiUrl.origin };
}

export function createContentSecurityPolicy(
  apiOrigin: string,
  environment = process.env,
) {
  const imageOrigins = (environment.NEXT_PUBLIC_IMAGE_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const origin = new URL(value);
      if (origin.protocol !== "https:") {
        throw new Error("NEXT_PUBLIC_IMAGE_ORIGINS entries must use HTTPS.");
      }
      return origin.origin;
    });
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}`,
    `img-src 'self' data: blob:${imageOrigins.length ? ` ${imageOrigins.join(" ")}` : ""}`,
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    environment.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  ].join("; ");
}

const clientBuildConfig = readClientBuildConfig();

const nextConfig: NextConfig = {
  async headers() {
    const contentSecurityPolicy = createContentSecurityPolicy(
      clientBuildConfig.apiOrigin,
    );
    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(process.env.NODE_ENV === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
        : []),
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Dev-only proxy for the relative NEXT_PUBLIC_API_BASE_URL case above —
    // forwards same-origin /api/v1/* calls (from the browser, possibly via
    // a tunnel) to the real API server, which only ever needs to be
    // reachable from this machine. A no-op whenever NEXT_PUBLIC_API_BASE_URL
    // is the normal absolute URL, since the browser then calls that origin
    // directly and never hits this rewrite table at all.
    if (process.env.NODE_ENV === "production") return [];
    const internalApiBase = (
      process.env.API_INTERNAL_BASE_URL || DEFAULT_DEVELOPMENT_API_URL
    ).replace(/\/$/, "");
    return [{ source: "/api/v1/:path*", destination: `${internalApiBase}/:path*` }];
  },
  async redirects() {
    return [
      { source: "/it-bootcamps", destination: "/bootcamps", permanent: true },
      { source: "/it-bootcamps/:path*", destination: "/bootcamps/:path*", permanent: true },
      { source: "/contributions", destination: "/free-learning", permanent: true },
      { source: "/contributions/:path*", destination: "/free-learning/:path*", permanent: true },
      { source: "/admin/bootcamps", destination: "/admin/catalog/courses", permanent: false },
      { source: "/admin/bootcamps/:path*", destination: "/admin/catalog/courses/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
