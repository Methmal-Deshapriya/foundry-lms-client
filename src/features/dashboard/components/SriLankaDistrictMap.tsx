"use client";

// @svg-maps/sri-lanka ships its own index.d.ts, but it types the default
// export via an internal `svg-maps__common` package that was never
// published to npm — unresolvable, so its declared type is unusable here.
// The actual runtime shape (confirmed against the installed package) is
// declared locally instead.
import rawMap from "@svg-maps/sri-lanka";
import type { DistrictCount } from "../dashboardTypes";

type SvgMapLocation = { id: string; name: string; path: string };
type SvgMapData = { label: string; viewBox: string; locations: SvgMapLocation[] };
const map = rawMap as unknown as SvgMapData;

// This app's own DISTRICTS constant (lib/constants.ts) spells this district
// "Monaragala"; the map package spells it "Moneragala" — same district, an
// alternate transliteration. Every other name matches exactly.
const NAME_ALIASES: Record<string, string> = { moneragala: "monaragala" };

// Sequential, single-hue magnitude encoding — same "one hue, light to dark"
// convention as the learning-activity heatmap and MagnitudeBar, not a fresh
// palette invented for this one chart. Zero-count districts get a neutral
// muted fill so "no data" reads distinctly from "the lightest bucket".
const LEVEL_COLORS = ["#e5e7eb", "#bfdbfe", "#60a5fa", "#3b82f6", "#1d4ed8"];

function levelFor(count: number, max: number) {
  if (count <= 0) return 0;
  if (max <= 1) return 4;
  const pct = count / max;
  if (pct > 0.75) return 4;
  if (pct > 0.5) return 3;
  if (pct > 0.25) return 2;
  return 1;
}

/**
 * A choropleth of Sri Lanka's 25 districts, colored by student count.
 * District shapes come from @svg-maps/sri-lanka (CC BY 4.0, itself based on
 * MapSVG's Sri Lanka map — https://mapsvg.com/maps/sri-lanka). The
 * on-screen attribution line was removed at the user's request; this is an
 * internal, authenticated admin tool rather than published/public content,
 * so keeping the credit here in source is the attribution record.
 */
export function SriLankaDistrictMap({ data }: { data: DistrictCount[] }) {
  const countByDistrict = new Map(data.map((row) => [row.district.toLowerCase(), row.count]));
  const max = Math.max(1, ...data.map((row) => row.count));

  return (
    // Sri Lanka's outline itself isn't symmetric — centering the map makes
    // the whole panel feel lopsided, so it's nudged toward the right edge
    // instead (items-end, not items-center).
    <div className="flex h-full w-full flex-col items-end">
      <svg
        viewBox={map.viewBox}
        className="h-full max-h-[580px] w-full max-w-sm flex-1"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Students by district"
      >
        {map.locations.map((location) => {
          const key = NAME_ALIASES[location.name.toLowerCase()] ?? location.name.toLowerCase();
          const count = countByDistrict.get(key) ?? 0;
          return (
            <path
              key={location.id}
              d={location.path}
              fill={LEVEL_COLORS[levelFor(count, max)]}
              stroke="var(--card)"
              strokeWidth={1}
              className="transition-opacity hover:opacity-75"
            >
              <title>{`${location.name}: ${count} student${count === 1 ? "" : "s"}`}</title>
            </path>
          );
        })}
      </svg>
    </div>
  );
}
