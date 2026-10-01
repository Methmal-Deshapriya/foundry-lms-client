/**
 * Admin-written link targets (notification buttons, the promotion banner's
 * call to action): an in-app path such as "/explore", or a full https://
 * link. The same rule as the server's `linkUrlField`.
 *
 * An in-app path may not start with "//" or "/\": browsers read a backslash
 * as a slash, so "/\evil.com" would open another site (code review M09-07).
 */
export const IN_APP_PATH = /^\/(?![/\\])[^\\]*$/;

/** "internal" for an in-app path, "external" for an https:// link, null for anything else. */
export function linkTarget(url: string | null | undefined): "internal" | "external" | null {
  const value = url?.trim();
  if (!value) return null;
  if (IN_APP_PATH.test(value)) return "internal";
  try {
    return new URL(value).protocol === "https:" ? "external" : null;
  } catch {
    return null;
  }
}
