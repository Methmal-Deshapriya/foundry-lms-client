import type {
  LearningServiceSlug,
  PublicCategoryDetail,
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

export const getPublicServiceCatalog = (service: LearningServiceSlug) =>
  fetchCatalog<PublicServiceCatalog>(`/catalog/${service}/categories`);

export const getPublicCategory = (
  service: LearningServiceSlug,
  categorySlug: string,
) =>
  fetchCatalog<PublicCategoryDetail>(
    `/catalog/${service}/categories/${categorySlug}`,
  );

export const getPublicCourse = (
  service: LearningServiceSlug,
  categorySlug: string,
  courseSlug: string,
) =>
  fetchCatalog<PublicCourseDetail>(
    `/catalog/${service}/categories/${categorySlug}/courses/${courseSlug}`,
  );

export const getPublicLearningServices = () =>
  fetchCatalog<{ services: PublicLearningService[] }>("/catalog/services");
