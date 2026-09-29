import { Award } from "lucide-react";

/**
 * A placeholder certificate mockup shared by every certificate-issuing
 * course — shown on the public course page so a prospective student can see
 * what they'll earn before enrolling. Deliberately generic (no per-course
 * upload, no R2 storage) since the same design is meant to be reused across
 * every course; swap this markup for the real certificate artwork once it's
 * supplied.
 */
export function CertificatePreview({ courseTitle }: { courseTitle: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 sm:p-10">
      <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-dashed border-zinc-200" aria-hidden="true" />
      <div className="relative flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-[#191919]">
          <Award className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="font-alt mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#71717A]">
          Certificate of Completion
        </p>
        <p className="font-sans mt-4 text-lg font-semibold text-[#191919] sm:text-xl">This certifies that</p>
        <p className="font-alt mt-1 text-sm text-[#71717A]">[Your name] has successfully completed</p>
        <p className="font-sans mt-3 max-w-md text-lg font-bold text-[#191919]">{courseTitle}</p>
        <div className="mt-8 flex w-full max-w-xs items-center justify-between border-t border-zinc-200 pt-3">
          <span className="font-alt text-xs text-[#71717A]">Foundry Academy</span>
          <span className="font-alt text-xs text-[#71717A]">Date issued</span>
        </div>
      </div>
    </div>
  );
}
