import type {
  LearningServiceSlug,
  PublicCourseDetail,
  PublicLearningService,
  PublicServiceCatalog,
} from "@/features/catalog/catalogTypes";

type ApiEnvelope<T> = { success: boolean; data?: T; error?: string };

async function fetchCatalog<T>(path: string): Promise<T | null> {
  // Runs server-side (Next.js fetch cache tags), so it always needs a real,
  // directly-reachable absolute URL — never the relative form
  // NEXT_PUBLIC_API_BASE_URL can take for the browser (see next.config.ts).
  // API_INTERNAL_BASE_URL overrides it for that case; unset everywhere else,
  // where the two are the same value anyway.
  const baseUrl = process.env.API_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      next: { revalidate: 300, tags: ["public-catalog"] },
    });
    if (response.status === 404) return null;
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || !payload.success || payload.data === undefined) {
      throw new Error(
        payload.error || `Catalog request failed (${response.status}).`,
      );
    }
    return payload.data;
  } catch (error) {
    console.error(`Catalog fetch failed for ${path}`, error);
    throw error;
  }
}

// Route params come straight from the URL. Anything that isn't a real slug
// is "not found" without calling the API, and real slugs are still encoded,
// so a crafted address can never steer this server-side fetch to another
// API path (code review M06-14).
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const isCatalogSlug = (value: string) => SLUG_PATTERN.test(value);

export const getPublicServiceCatalog = async (service: LearningServiceSlug) =>
  isCatalogSlug(service) ? fetchCatalog<PublicServiceCatalog>(`/catalog/${encodeURIComponent(service)}/courses`) : null;

export const getPublicCourse = async (
  service: LearningServiceSlug,
  courseSlug: string,
) =>
  isCatalogSlug(service) && isCatalogSlug(courseSlug)
    ? fetchCatalog<PublicCourseDetail>(`/catalog/${encodeURIComponent(service)}/courses/${encodeURIComponent(courseSlug)}`)
    : null;

export const getPublicLearningServices = () =>
  fetchCatalog<{ services: PublicLearningService[] }>("/catalog/services");
