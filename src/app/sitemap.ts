import type { MetadataRoute } from "next";
import { getPublicLearningServices, getPublicServiceCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/seo";

// Every public page search engines should know about: the static pages,
// each live service, and each published course. Rebuilt from the same
// cached public catalog the pages use (code review M06-04).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/consultations`, changeFrequency: "monthly", priority: 0.5 },
  ];
  try {
    const services = (await getPublicLearningServices())?.services ?? [];
    const catalogs = await Promise.all(services.map((service) => getPublicServiceCatalog(service.slug).catch(() => null)));
    const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${SITE_URL}/${service.slug}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    const coursePages: MetadataRoute.Sitemap = services.flatMap((service, index) =>
      (catalogs[index]?.courses ?? []).map((course) => ({
        url: `${SITE_URL}/${service.slug}/${course.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );
    return [...staticPages, ...servicePages, ...coursePages];
  } catch {
    // The API being down must not break the sitemap itself.
    return staticPages;
  }
}
