---
name: admin-page-patterns
description: Foundry LMS admin-panel UI/UX conventions distilled from the Session Library page (/admin/sessions) rebuild. Use whenever building or editing an admin-dashboard page — course pages, category pages, service pages, curriculum/roster pages, or any authenticated (dashboard) list/detail/dialog UI — so every page shares the same filter bar, table, detail-sheet, dialog, icon, button, and error-handling conventions instead of drifting into one-off styling.
---

# Admin page patterns

Reference implementation: [`src/features/sessions/components/admin/SessionLibraryManager.tsx`](../../../src/features/sessions/components/admin/SessionLibraryManager.tsx).
When in doubt about how something should look or behave on a new admin page, open that file and copy the pattern rather than inventing a new one. This skill is the checklist version of it.

## Page header

Use `AdminCatalogPageHeader` (`src/features/catalog/components/AdminCatalogPageHeader.tsx`) for every admin page's title block, not a raw `<h1>`:

```tsx
<AdminCatalogPageHeader
  title="Session Library"
  description="..."
  icon={Icons.sessionLibrary}
  action={<Button>...</Button>}
/>
```

- Title renders at `text-xl` (not `text-2xl` — a bigger title was explicitly rejected as "too big").
- `icon` is optional but when present it's a small `size-4 text-primary` glyph inline before the title text, pulled from the central icon registry (see below) — never a standalone icon tile in the page header.

## Filters row: single line, pills as KPIs, no dropdown for status

- Search input, secondary text filter (e.g. tag), and status filter all sit on **one line**, never stacked ("the layout shouldn't be two-story"). Order: text filters first, then filter pills.
- Status/category filtering is **pills with live counts**, not a `<select>` — each pill reads like a KPI: `All (8)`, `Ready (5)`, `Draft (3)`, `Archived (0)`. Backend returns a flat summary object (e.g. `{ all, ready, draft, archive }`) computed via a `groupBy` aggregate alongside the main list query — don't compute counts by filtering the current page's rows client-side, that only reflects the current page/filter, not the true totals.
- All three controls — text inputs and pills — share the same height and border radius as the buttons next to them (`h-9`, matching radius). Don't let native input default height make the row uneven.

## Debounced + minimum-length search

Never fire an API request per keystroke. Combine two independent techniques (they solve different problems, use both, not just one):

- **Debounce** (~300ms) — wait for a pause in typing. Implemented via a small local hook:
  ```tsx
  function useDebouncedValue(value: string, delayMs: number) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const timer = setTimeout(() => setDebounced(value), delayMs);
      return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
  }
  ```
- **Minimum query length** (3 chars) — below the threshold, don't let the debounced value reach the query params at all, so RTK Query sees no param change and issues no request even after the debounce settles:
  ```tsx
  const appliedQ = debouncedQ.length === 0 || debouncedQ.length >= MIN_FILTER_LENGTH ? debouncedQ : "";
  ```
  Length `0` (field cleared) must still pass through immediately so clearing a filter resets the list.
- Reset pagination offset to `0` directly inside the filter's `onChange` handler (not in a `useEffect`, which trips the `react-hooks/set-state-in-effect` lint rule).

## Tables

- `table-fixed` layout with explicit `w-*` widths on every column except one flexible text column, so the table degrades gracefully on narrow screens instead of horizontal-scrolling or wrapping.
- The flexible long-text column (resource/title names, etc.) needs `max-w-0` on the `<TableCell>` plus `truncate` on the inner text node — `max-w-0` is required for `truncate` to actually engage inside a fixed-width flex/table cell — and a `title={fullText}` attribute so the full value is still available on hover.
- Whole rows are clickable and open a `Sheet` with full detail, using an interactive-element exclusion pattern so nested controls (buttons, menu triggers, links) don't also trigger row navigation:
  ```tsx
  const INTERACTIVE_SELECTOR = "input,button,a,[role=menuitem],[data-no-row-navigation]";
  ```
  Any cell with its own interactive content (e.g. the Actions cell) gets `data-no-row-navigation` on the `<TableCell>`.
- Actions column: only put the 2-3 highest-frequency actions inline (status change, edit, duplicate); everything else — including permanently-destructive actions — goes in a `DropdownMenu` or into the detail Sheet. Give the actions column enough fixed width (e.g. `w-28`, not `w-16`) — a too-narrow fixed column silently eats the cell's own padding before you notice it's a width problem, not a padding problem.
- Don't repeat a column's info inside the row a second time (e.g. don't also show "last updated" as a second line under the title — give it its own column instead); the same rule applies in reverse in the detail Sheet (don't show a field twice between the table row and the Sheet).

## Detail Sheet

- Use the shared `Sheet`/`SheetContent` for "view full details of one row" rather than growing the dialog or the table row itself.
- Cap it at a sensible max height and make the body `overflow-y-auto` — long "used in" / related-entity lists must scroll inside the Sheet, not push the Sheet itself to full page height.
- Only show data the table row doesn't already show (see above), and don't have the frontend re-derive/display parent-entity chains (e.g. course → category → service names) if a direct link already exists to that entity — that's wasted API payload and UI clutter; keep just enough (an id/slug) to build the link.
- `SheetContent` (and the sidebar) use the plain `bg-background` surface — the old blue/violet `CATALOG_GRADIENT_BG` wash was removed app-wide on request (2026-09-30). Don't reintroduce a gradient background on sheets, drawers or the sidebar.

## Dialogs (create/edit forms)

- **Never** use `window.confirm`/`window.prompt`. Use shadcn `AlertDialog` for confirmations and `Dialog` for forms — every time, no exceptions.
- Destructive confirmations that need "type to confirm" should ask for a short fixed literal (e.g. `DELETE`), not the full entity title — faster to type, same friction value.
- Any dropdown inside a dialog or page uses the shared **custom** `Select` component at `src/components/ui/select.tsx` — a bespoke button+listbox component, **not** a native `<select>` and **not** a new Radix `Select`. Its default sizing (`h-12 rounded-xl bg-muted/50`) is tuned for public-facing forms; in admin dialogs/toolbars size it down via `className` (which overrides via `cn()`), e.g. `className="h-10 w-full rounded-md py-0 pl-3 pr-8 text-sm"` for a dialog field or `className="h-9 w-28 rounded-md py-0 pl-3 pr-8 text-sm"` for a compact toolbar control (the exact pattern used for the page-size picker). It's string-options-only — map enum values to display labels and back rather than trying to pass objects.
- Mark every required field's `<Label>` with a trailing red asterisk: `<span className="text-red-500" aria-hidden="true">*</span>`.
- For a form with more than ~6 fields or multiple logical groups (e.g. core info vs. resource links vs. a save preview), split it into a **stepper wizard** rather than one long scroll:
  - A numbered-circle-plus-connecting-line header (`Icons`-free — a plain number, replaced with a `Check` glyph once a step is completed, gradient fill on the active step).
  - Gate `Next` on that step's own validation (e.g. title length, a conditionally-required URL); let `Enter` in a text field advance the step instead of submitting the whole form early — route all step transitions and the final submit through one `onSubmit` handler that branches on the current step, rather than separate `onClick` validators.
  - Final step is a read-only preview of everything about to be saved (status badge, tags, description, a checklist of which optional fields were filled in) before the real submit button appears.
  - Give the stepper and the first field below it real vertical separation (`pt-4` under the header stepper, `pt-2 space-y-6` at the top of the form body) — a cramped stepper-to-fields gap reads as broken, not compact.
  - Don't put a decorative icon tile next to the dialog title — it was tried and explicitly rejected as not matching the dialog's tone; keep the header to title + description + stepper only.
- Field-level backend validation errors map into local `fieldErrors` state per field name (via `isNormalizedApiError(error) && error.field`) and render as `<p role="alert" className="text-xs font-medium text-destructive">` under that field — never a raw toast for a field-specific problem.

## Form field focus style: no ring, anywhere

No text field anywhere in the app — admin or public, page or dialog — shows the default blue Tailwind focus ring/box-shadow. This is a system-wide rule, fixed once at the shared component rather than per-instance:

- `src/components/ui/input.tsx` (the shared `Input`) has no `focus-visible:ring-*` classes, only `focus-visible:outline-none` — this alone covers every `<Input>` usage app-wide, admin and public, with zero per-page overrides needed.
- A raw `<textarea>` (there's no shared `Textarea` component yet) needs `focus-visible:outline-none` added directly in its own `className` to suppress the browser's native default outline.
- The custom `Select` (`src/components/ui/select.tsx`) already has no ring — its focus state is a border-color change only (`focus-visible:border-primary`), which is fine as-is and doesn't need touching.
- Don't reach for a global CSS override (e.g. `input:focus { outline: none }` in `globals.css`) to try to do this in one place — Tailwind's `@layer utilities` always wins the cascade over anything in `@layer base` regardless of selector specificity, so a base-layer rule silently fails to override a `ring-*` utility class. Edit the component/class directly instead.
- This does remove a visible focus indicator for keyboard users on text fields — a deliberate, repeated, explicit design call for this app, not an oversight. Buttons, pills, and menu items keep their own focus-visible styling; don't extend "no ring anywhere" to interactive controls that weren't asked for.

## Icons

Every icon anywhere in the app comes from the central registry at `src/lib/icons.ts`:

```tsx
import { Icons } from "@/lib/icons";
// ...
<Icons.sessionLibrary className="size-4" aria-hidden="true" />
```

- Never `import { SomeIcon } from "lucide-react"` directly in feature/page code. Add the icon to the `Icons` object in `src/lib/icons.ts` first, under a semantic key (`dashboard`, `sessionLibrary`, `users`, …), then reference `Icons.<key>` everywhere it's needed.
- Delete an entry from the registry if you remove its last usage — don't leave dead icons behind (e.g. `sessionResource` was added for a dialog-title icon that was then rejected, and removed again once nothing referenced it).

## Buttons & color

- The shared `Button`'s default variant is already the house gradient (`bg-linear-to-r from-blue-600 to-indigo-500 text-white hover:opacity-90`, matching the public sign-in button) — just use `<Button>`, don't reinvent a primary style per page.
- A permanently-destructive action (hard delete) gets a red/rose **gradient**, not a flat bold-red background, consistent with the primary button's gradient treatment.

## Light mode only

There is no dark theme anywhere in this app (removed system-wide, including authenticated dashboard pages). Never add a `dark:` Tailwind variant, never gate on `prefers-color-scheme`, never reintroduce a theme toggle.

## Error handling

- Read API errors through `getApiErrorMessage(error, fallback)` / `isNormalizedApiError(error)` from `@/lib/api` — never render `error.message`/a raw thrown error string straight into a toast or the UI. The backend's `handlePrismaError` fallback returns a generic message on purpose (see `foundry_lms_server/src/utils/Errors.js`); if you ever see a raw Prisma/SQL error reach the browser, that's a backend bug to fix at the source, not something to catch client-side.

## Before calling any page "done"

Run both, and don't consider a change finished until both are clean:

```bash
npm run lint
npm run build
```
