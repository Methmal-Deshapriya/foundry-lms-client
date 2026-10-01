// Site-wide SEO helpers (code review M06-04).
export const SITE_URL = "https://foundrylms.com";
export const SITE_NAME = "Foundry Academy";

/**
 * JSON-LD for a <script type="application/ld+json"> tag. "<" is escaped so
 * text from the catalog can never close the script tag (the Next.js JSON-LD
 * guide's recommendation).
 */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Foundry Academy delivers industry-ready bootcamps in AI/ML, Full-Stack Development, Cybersecurity, Data Science, and UX/UI for Sri Lankan students.",
  sameAs: ["https://www.facebook.com/foundrylms", "https://www.instagram.com/foundrylms", "https://www.linkedin.com/company/foundrylms"],
  logo: `${SITE_URL}/favicon.png`,
  brand: SITE_NAME,
  address: { "@type": "PostalAddress", addressCountry: "LK" },
};

/** Per-page Open Graph + Twitter + canonical, so a shared link previews this page, not the homepage. */
export function pageMetadata({ title, description, path, image }: { title: string; description: string; path: string; image?: string | null }) {
  const images = image ? [{ url: image }] : undefined;
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: "website", ...(images ? { images } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
  };
}
