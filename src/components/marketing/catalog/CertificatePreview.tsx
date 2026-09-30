import Image from "next/image";

/**
 * The sample certificate shared by every certificate-issuing course — shown
 * on the public course page so a prospective student can see what they'll
 * earn before enrolling. Deliberately generic (placeholder name/program, no
 * per-course upload, no R2 storage) since the same design is reused across
 * every course.
 */
export function CertificatePreview({ courseTitle }: { courseTitle: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <Image
        src="/certificate/certificate_dummy.webp"
        alt={`Sample Foundry Academy certificate of completion, like the one awarded for ${courseTitle}`}
        width={1584}
        height={993}
        sizes="(min-width: 1024px) 620px, 100vw"
        className="h-auto w-full"
      />
    </div>
  );
}
