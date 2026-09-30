// A visitor who clicks enroll on a public course page before logging in
// carries that intent through the whole auth funnel (sign-in, sign-up,
// email verification, admin login code, the guest-guard redirect) as a
// query param, so the dashboard's intent handlers can pick it up at the end:
//   enrollCourse  — free course: the open intake id (EnrollmentIntentHandler)
//   requestCourse — paid course: the course id (EnrollmentRequestIntentHandler)
const INTENT_KEYS = ["enrollCourse", "requestCourse"] as const;

/**
 * Returns `path` with any enroll intent from `source` (usually the current
 * page's searchParams) appended, preserving whatever query `path` already
 * has — so every step of the funnel forwards both intents the same way.
 */
export function withEnrollIntent(path: string, source: { get(key: string): string | null }) {
  const url = new URL(path, "http://intent.local");
  for (const key of INTENT_KEYS) {
    const value = source.get(key);
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
