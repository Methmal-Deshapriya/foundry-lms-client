import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public marketing pages are crawlable; signed-in areas and auth screens
// aren't worth indexing (code review M06-04).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/dashboard",
        "/my-courses",
        "/account",
        "/certificates$",
        "/projects$",
        "/explore",
        "/api/",
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/verify-login",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
