import type { PublicCertificateVerification } from "@/features/certificates/certificatesTypes";
import type { PublicStudentProfile, PublicStudentProfileRedirect } from "@/features/profiles/profilesTypes";
import type { StudentProject } from "@/features/projects/projectsTypes";

type ApiEnvelope<T> = { success: boolean; data?: T };

/**
 * Server-side reads for the public profile, showcase and verify pages, so
 * they have real page metadata for link previews and search (code review
 * M08-10). Never throws: a failed read only costs the page its specific
 * metadata, and the page itself still loads the data in the browser.
 *
 * Not cached, so a profile the student hides, or a certificate that is
 * revoked, stops previewing at once.
 */
async function fetchPublic<T>(path: string): Promise<T | null> {
  // Same base URL rule as lib/catalog.ts: server-side needs an absolute URL.
  const baseUrl = process.env.API_INTERNAL_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;
  try {
    const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.success && payload.data !== undefined ? payload.data : null;
  } catch {
    return null;
  }
}

export const getPublicProfile = (slug: string) =>
  fetchPublic<PublicStudentProfile | PublicStudentProfileRedirect>(`/profiles/public/${encodeURIComponent(slug)}`);

export const getShowcaseProject = (id: string) => fetchPublic<StudentProject>(`/projects/showcase/${encodeURIComponent(id)}`);

export const getCertificateVerification = (code: string) =>
  fetchPublic<PublicCertificateVerification>(`/certificates/verify/${encodeURIComponent(code)}`);

/** Trim text to a search-result-sized description. */
export function summarize(text: string | null | undefined, fallback: string) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
}
