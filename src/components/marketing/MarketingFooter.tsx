import type { SVGProps } from "react";
import Link from "next/link";
import { Facebook, Linkedin, Mail, Youtube } from "lucide-react";

// lucide-react has no WhatsApp glyph (it's a brand logo, not a generic
// icon) — this is the official path from simple-icons.
function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// Same number/format the WhatsApp CTA elsewhere on the site already uses
// (ContactCTAButton.tsx) — 072 362 2112 with the leading 0 dropped and the
// country code (94) prepended.
const WHATSAPP_URL = "https://wa.me/94723622112";
const EMAIL = "cources.foundry@gmail.com";

const SOCIAL_LINKS = [
  { label: "YouTube", href: "https://www.youtube.com/@FoundryAcademySL", icon: Youtube },
  { label: "Facebook", href: "https://www.facebook.com/share/1PZCRY881q/?mibextid=wwXIfr", icon: Facebook },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/foundry123/", icon: Linkedin },
  { label: "WhatsApp", href: WHATSAPP_URL, icon: WhatsAppIcon },
  { label: "Email", href: `mailto:${EMAIL}`, icon: Mail },
];

const EXPLORE_LINKS = [
  { label: "Home", href: "/" },
  { label: "Bootcamps", href: "/bootcamps" },
  { label: "PreTech Courses", href: "/pretech-courses" },
  { label: "Free Learning", href: "/free-learning" },
  { label: "Consultations", href: "/consultations" },
];

/**
 * MarketingFooter
 *
 * Shared across every public marketing page (see (marketing)/layout.tsx).
 * The one place Foundry Academy's contact/social details live — update
 * here, not per-page.
 */
export function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto w-full max-w-6xl px-3 py-12 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
          {/* Brand + social */}
          <div>
            <p className="font-sans text-lg font-extrabold tracking-tight">
              <span className="text-[#191919]">Foundry</span> <span className="text-[#E91717]">Academy</span>
            </p>
            <p className="font-alt mt-3 max-w-xs text-sm text-[#71717A]">
              Practical bootcamps, real mentorship, and hands-on projects —
              helping beginners become job-ready.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="font-alt text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-4">
              Explore
            </p>
            <ul className="space-y-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-alt text-sm text-[#3F3F46] transition-colors hover:text-[#191919]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-alt text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-4">
              Contact
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="font-alt flex items-center gap-2 text-sm text-[#3F3F46] transition-colors hover:text-[#191919]"
                >
                  <Mail className="h-4 w-4 shrink-0 text-[#71717A]" aria-hidden="true" />
                  {EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-alt flex items-center gap-2 text-sm text-[#3F3F46] transition-colors hover:text-[#191919]"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#71717A]" />
                  072 362 2112
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-100 pt-6">
          <p className="font-alt text-xs text-[#A1A1AA]">
            © {new Date().getFullYear()} Foundry Academy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default MarketingFooter;
