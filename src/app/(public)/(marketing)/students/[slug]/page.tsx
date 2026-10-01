import { redirect } from "next/navigation";
import { getPublicProfile, summarize } from "@/lib/publicPages";
import { SITE_NAME, pageMetadata } from "@/lib/seo";
import { PublicStudentProfileView } from "./PublicStudentProfileView";

type Params = { params: Promise<{ slug: string }> };

// Rendered on the server for its metadata, so a shared profile link
// previews the student, not the homepage (code review M08-10).
export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  // Hidden, unpublished or unknown profiles look the same, and aren't indexed.
  if (!profile || "redirectToSlug" in profile) return { title: `Student profile | ${SITE_NAME}`, robots: { index: false } };
  return pageMetadata({
    title: profile.name,
    description: summarize(profile.headline || profile.bio, `${profile.name}'s projects and certificates from ${SITE_NAME}.`),
    path: `/students/${profile.slug}`,
    image: profile.avatarUrl,
  });
}

export default async function PublicStudentProfilePage({ params }: Params) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  // A link the student has since changed goes to their current page
  // (code review M08-09).
  if (profile && "redirectToSlug" in profile) redirect(`/students/${encodeURIComponent(profile.redirectToSlug)}`);
  return <PublicStudentProfileView slug={slug} />;
}
