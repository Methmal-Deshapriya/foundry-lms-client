import { revalidateTag } from "next/cache";
import { hasBearerSecret } from "@/lib/secretCompare";

const PUBLIC_CATALOG_TAG = "public-catalog";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const configuredSecret = process.env.CATALOG_REVALIDATION_SECRET;

  if (!configuredSecret) {
    console.error("CATALOG_REVALIDATION_SECRET is not configured.");
    return Response.json(
      { success: false, error: "Catalog revalidation is not configured." },
      { status: 503 },
    );
  }

  if (!hasBearerSecret(request.headers.get("authorization"), configuredSecret)) {
    return Response.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  // Expire immediately so the next public request blocks for fresh API data.
  // The normal five-minute lifetime remains the fallback between admin writes.
  revalidateTag(PUBLIC_CATALOG_TAG, { expire: 0 });

  return Response.json({ success: true, data: { tag: PUBLIC_CATALOG_TAG } });
}
