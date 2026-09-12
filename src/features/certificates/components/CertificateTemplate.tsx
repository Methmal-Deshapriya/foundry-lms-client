import { format } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export interface CertificateTemplateProps {
  studentName: string;
  courseName: string;
  description?: string | null;
  issuedDate: string;
  certificateCode: string;
  skills: string[];
  verifyUrl: string;
}

// The one shared visual template every Foundry Academy certificate uses,
// regardless of which service/category issued it. Deliberately its own
// black+red print identity, not the dashboard's blue --primary theme — see
// the 2026-09-10 certificate plan, §4. Rendered identically on-screen (this
// component) and into the exported PNG/PDF (html-to-image captures this
// same DOM node), so the download can never drift from what's shown here.
export default function CertificateTemplate({
  studentName,
  courseName,
  description,
  issuedDate,
  certificateCode,
  skills,
  verifyUrl,
}: CertificateTemplateProps) {
  const shortId = certificateCode.slice(-10).toUpperCase();
  const displayName = toTitleCase(studentName);

  return (
    <div className="relative flex aspect-[16/10] w-full overflow-hidden bg-white text-black">
      {/* Left panel */}
      <div className="flex w-[42%] shrink-0 flex-col justify-between p-8">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- this DOM node is captured by html-to-image for PNG/PDF export; next/image's lazy-loading and srcset would interfere with that capture */}
          <img
            src="/certificate/certificate_foundry_logo.png"
            alt="Foundry Academy"
            className="h-9 w-auto"
          />
          <p className="mt-2 text-xs text-gray-500">
            {format(new Date(issuedDate), "MMM d, yyyy")}
          </p>
          <h1 className="mt-2 text-xl font-extrabold leading-tight text-black">
            {displayName}
          </h1>
          <p className="mt-0 text-xs text-gray-400">has successfully completed</p>
          <p className="mt-6 text-base font-bold text-black">{courseName}</p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            This is to certify successful completion of the program, having covered the
            skill set listed below during this course.
          </p>

          {skills.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex max-w-60 gap-4">
          <SignatureBlock src="/certificate/certificate_anushka_sign.jpeg" />
          <SignatureBlock src="/certificate/certificate_methmal_sign.webp" />
        </div>
      </div>

      {/* Right panel */}
      <div className="relative flex flex-1 flex-col items-center justify-start overflow-hidden bg-gray-50 px-10 pb-8 pt-16 text-center">
        <HexagonBackdrop />

        {/* eslint-disable-next-line @next/next/no-img-element -- captured by html-to-image, see note on the logo above */}
        <img
          src="/certificate/certificate_badge.png"
          alt="Certified"
          className="relative h-44 w-auto"
        />

        <h2 className="relative -mt-4 text-2xl font-extrabold text-black">{courseName}</h2>
        {description ? (
          <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500">
            {description}
          </p>
        ) : null}

        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-1">
          <QRCodeSVG value={verifyUrl} size={64} level="M" />
          <p className="text-[10px] font-medium text-gray-500">ID: {shortId}</p>
        </div>
      </div>
    </div>
  );
}

// Two instructors sign every certificate — one column each, sharing the
// same layout. `src` intentionally isn't validated as existing: drop the
// matching file into public/certificate/ and it renders, same as the other
// certificate assets.
function SignatureBlock({ src }: { src: string }) {
  return (
    <div className="flex-1 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- captured by html-to-image, see note on the logo above */}
      <img src={src} alt="Instructor signature" className="mx-auto h-8 w-auto" />
      <div className="border-t border-gray-400 pt-1.5">
        <p className="text-xs text-gray-600">Instructor, Foundry</p>
      </div>
    </div>
  );
}

// The name on file can come back in any casing (however the admin/API typed
// it) — a certificate should never print a name in all-lowercase, so this
// title-cases every word regardless of what was stored.
function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function HexagonBackdrop() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-gray-200"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="cert-hex"
          width="28"
          height="24.25"
          patternUnits="userSpaceOnUse"
          patternTransform="scale(1)"
        >
          <path
            d="M14 0 L28 8.08 L28 24.25 L14 32.33 L0 24.25 L0 8.08 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cert-hex)" />
    </svg>
  );
}
