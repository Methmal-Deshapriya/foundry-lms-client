import { notFound } from "next/navigation";
import { ApiCourseDetail } from "@/components/marketing/catalog/ApiCourseDetail";
import { getPublicCourse } from "@/lib/catalog";
import { SITE_NAME, SITE_URL, jsonLd, pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ service: string; course: string }>;
}) {
  const { service, course } = await params;
  const detail = await getPublicCourse(service, course);
  return detail
    ? pageMetadata({ title: detail.title, description: detail.summary, path: `/${service}/${course}`, image: detail.thumbnailUrl })
    : {};
}

export default async function PublicCoursePage({
  params,
}: {
  params: Promise<{ service: string; course: string }>;
}) {
  const { service, course } = await params;
  const detail = await getPublicCourse(service, course);
  if (!detail) notFound();
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: detail.title,
    description: detail.summary,
    url: `${SITE_URL}/${service}/${course}`,
    ...(detail.thumbnailUrl ? { image: detail.thumbnailUrl } : {}),
    provider: { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL },
    ...(detail.accessType === "PAID"
      ? { offers: { "@type": "Offer", price: detail.price, priceCurrency: detail.currency, category: "Paid" } }
      : { isAccessibleForFree: true }),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(courseJsonLd)} />
      <ApiCourseDetail course={detail} />
    </>
  );
}
