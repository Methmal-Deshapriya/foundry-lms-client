"use client";

import { useState } from "react";
import { Play } from "lucide-react";

function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      const match = parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Course-detail-page explainer video — same click-to-play pattern as the
 * landing page's AboutVideo (nothing loads until the visitor actually plays
 * it). The R2-backed thumbnail is optional: with none set, or if it fails to
 * load, the container's own black background is the fallback (no illustrated
 * placeholder graphic — a plain black screen behind the play button, same as
 * a video player showing before its poster frame loads).
 */
export function CourseExplainerVideo({
  videoUrl,
  thumbnailUrl,
  title,
}: {
  videoUrl: string;
  thumbnailUrl: string | null;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailErrored, setThumbnailErrored] = useState(false);
  const videoId = extractYoutubeVideoId(videoUrl);
  if (!videoId) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Play video: ${title}`}
        >
          {thumbnailUrl && !thumbnailErrored ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary R2 URL; next/image's domain allowlist would need constant upkeep
            <img
              src={thumbnailUrl}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              onError={() => setThumbnailErrored(true)}
            />
          ) : null}
          <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#191919] shadow-lg transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
              <Play className="ml-1 h-6 w-6 fill-current sm:h-7 sm:w-7" aria-hidden="true" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
