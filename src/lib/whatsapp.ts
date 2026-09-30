import { CONTACT_PHONE_INTERNATIONAL } from "./contact";

/** A wa.me link that opens a chat with Foundry Academy, message pre-filled for this course. */
export function getWhatsAppEnrollUrl(courseTitle: string) {
  const message = `Hi Foundry Academy, I want to buy this course: ${courseTitle}`;
  return `https://wa.me/${CONTACT_PHONE_INTERNATIONAL}?text=${encodeURIComponent(message)}`;
}

/**
 * "Hire me" on a public student profile. Enquiries come to Foundry Academy,
 * never straight to the student — no student contact details are ever
 * public, and the academy makes the introduction.
 */
export function getWhatsAppHireUrl(studentName: string, profileUrl: string) {
  const message = `Hi Foundry Academy, I'd like to hire ${studentName} — ${profileUrl}`;
  return `https://wa.me/${CONTACT_PHONE_INTERNATIONAL}?text=${encodeURIComponent(message)}`;
}
