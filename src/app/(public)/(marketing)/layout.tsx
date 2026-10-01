import React from "react";
import { MarketingNavbar, type ServiceLink } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getPublicLearningServices } from "@/lib/catalog";

// Used only if the catalog can't be reached, so the site still has its menu.
const FALLBACK_SERVICE_LINKS: ServiceLink[] = [
  { label: "Bootcamps", href: "/bootcamps" },
  { label: "PreTech Courses", href: "/pretech-courses" },
  { label: "Free Learning", href: "/free-learning" },
];

// The service links come from the live catalog (cached under the
// public-catalog tag), so a new service appears in the menu and a renamed
// or drafted one never leaves a dead link (code review M06-09).
async function loadServiceLinks(): Promise<ServiceLink[]> {
  try {
    const services = (await getPublicLearningServices())?.services ?? [];
    if (services.length === 0) return FALLBACK_SERVICE_LINKS;
    return [...services]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => ({ label: service.title, href: `/${service.slug}` }));
  } catch {
    return FALLBACK_SERVICE_LINKS;
  }
}

export default async function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serviceLinks = await loadServiceLinks();
  return (
    <>
      <MarketingNavbar serviceLinks={serviceLinks} />
      {children}
      <MarketingFooter serviceLinks={serviceLinks} />
    </>
  );
}
