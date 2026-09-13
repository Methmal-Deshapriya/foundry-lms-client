import { format } from "date-fns";
import type { HeatmapDay } from "../dashboardTypes";

const WEEKS = 26;
const DAYS = WEEKS * 7;

// Sequential, single-hue magnitude encoding (see the dataviz skill's
// color-formula: sequential = one hue, light -> dark) — reuses the same
// primary ramp MagnitudeBar already uses elsewhere on this dashboard,
// rather than introducing GitHub's green.
const LEVEL_CLASSES = ["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

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
 * A 26-week (~6-month) learning-activity grid — the same idea as a GitHub
 * contribution graph, scoped to session completions since that's the one
 * signal uniquely suited to "did you show up" that nothing else on this
 * dashboard already surfaces. Columns are plain 7-day chunks counting back
 * from today rather than calendar-aligned weeks, which keeps the query and
 * the render simple; the exact date is still in each cell's tooltip. At 26
 * columns this is wider than the card it lives in, so the grid scrolls
 * horizontally within itself rather than widening the page.
 */
export function ActivityHeatmap({ heatmap }: { heatmap: HeatmapDay[] }) {
  const countByDate = new Map(heatmap.map((day) => [day.date, day.count]));

  const cells: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    cells.push({ date: key, count: countByDate.get(key) ?? 0 });
  }

  const max = Math.max(1, ...cells.map((cell) => cell.count));
  const totalSessions = cells.reduce((sum, cell) => sum + cell.count, 0);
  const activeDays = cells.filter((cell) => cell.count > 0).length;

  // Chunked into per-week columns and laid out with plain flexbox — a CSS
  // grid with auto-placed items inside a shrink-to-fit (`w-fit`) container
  // was landing cells inconsistently across browsers; flex columns of 7
  // fixed-size cells each is unambiguous and keeps oldest-week-first order.
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  return (
    <div className="rounded-md border border-input bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Learning activity</h3>
          <p className="text-xs text-muted-foreground">
            {totalSessions > 0 ? `${totalSessions} sessions over ${activeDays} days` : "Last 6 months"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex w-fit gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((cell) => (
                <div
                  key={cell.date}
                  title={`${cell.count} session${cell.count === 1 ? "" : "s"} completed on ${format(new Date(cell.date), "MMM d, yyyy")}`}
                  className={`size-2.5 shrink-0 rounded-sm ${LEVEL_CLASSES[levelFor(cell.count, max)]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-xs text-muted-foreground">
        Less
        {LEVEL_CLASSES.map((className) => (
          <span key={className} className={`size-3 rounded-sm ${className}`} aria-hidden="true" />
        ))}
        More
      </div>
    </div>
  );
}
