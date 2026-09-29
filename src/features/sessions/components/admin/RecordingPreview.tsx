import { Play } from "lucide-react";

// Shared between the Session Library resource sheet and the intake curriculum
// sheet — same session content, same visual treatment, in both places.
export function RecordingPreview({ url }: { url: string | null | undefined }) {
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground">
        No recording added yet
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open recording"
      className="group flex h-40 items-center justify-center rounded-md bg-linear-to-br from-[#191919]/15 via-[#191919]/5 to-transparent transition hover:from-[#191919]/25 hover:via-[#191919]/10"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-[#191919] text-white shadow-sm transition group-hover:scale-105">
        <Play className="size-6 fill-current" aria-hidden="true" />
      </span>
    </a>
  );
}
