"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// CertificateTemplate is laid out with fixed rem font sizes tuned for a
// large on-screen/export render (~860px wide) — shrinking its own container
// via plain CSS width wouldn't shrink the text with it, just cause it to
// overflow/wrap badly. Rendering it at its natural design width, then
// scaling the whole thing down with a CSS transform, keeps every line break
// and proportion identical to the full-size certificate, just smaller.
const DESIGN_WIDTH = 860;
const DESIGN_HEIGHT = (DESIGN_WIDTH * 10) / 16; // matches CertificateTemplate's aspect-[16/10]

export function CertificateThumbnail({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / DESIGN_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: "16 / 10" }}>
      <div
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
