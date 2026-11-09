import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Constant-time check that a request's Authorization header is
 * "Bearer <expected>". Both sides are hashed first, so the compare always
 * runs on equal-length buffers and leaks neither the secret's length nor
 * how many characters matched (code review M06-06).
 */
export function hasBearerSecret(authorization: string | null, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization ?? ""), digest(`Bearer ${expected}`));
}
