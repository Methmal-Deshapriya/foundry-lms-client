"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

const YOUTUBE_VIDEO_ID = "sXaJ9b-00u0";

/**
 * AboutVideo
 *
 * The target of the hero's "Watch video" link. Loads only a static
 * thumbnail on page load — the real YouTube iframe (and the JS it pulls in)
 * is only mounted once the visitor actually clicks play, so this section
 * costs nothing until it's used.
 */
export function AboutVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto px-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1`}
            title="What is Foundry Academy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label="Play video: What is Foundry Academy"
          >
            <Image
              src="/thumbnail.webp"
              alt="What is Foundry Academy"
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/25">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#191919] shadow-lg transition-transform group-hover:scale-105 sm:h-20 sm:w-20">
                <Play className="ml-1 h-6 w-6 fill-current sm:h-7 sm:w-7" aria-hidden="true" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default AboutVideo;
