// Foundry Academy's enrollment WhatsApp line — 072 362 2112 in Sri Lankan
// local format, written here in the international form (country code 94,
// no leading 0) that wa.me links require.
export const ENROLLMENT_WHATSAPP_NUMBER = "94723622112";

/** A wa.me link that opens a chat with the enrollment line, message pre-filled for this course. */
export function getWhatsAppEnrollUrl(courseTitle: string) {
  const message = `Hi Foundry Academy, I want to buy this course: ${courseTitle}`;
  return `https://wa.me/${ENROLLMENT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
