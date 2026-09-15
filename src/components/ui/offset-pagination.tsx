"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const PAGE_SIZE_LABELS = PAGE_SIZE_OPTIONS.map((size) => `${size} / page`);

// The "Showing X–Y of Z" + page-size Select + Previous/Next footer
// established for Session Library — reused by every offset-paginated
// admin table (a bounded, single-scope list that can afford a real total
// count, as opposed to an unbounded cursor-paginated one).
export function OffsetPagination({
  id,
  total,
  offset,
  pageSize,
  shownCount,
  hasMore,
  onOffsetChange,
  onPageSizeChange,
}: {
  id: string;
  total: number;
  offset: number;
  pageSize: number;
  shownCount: number;
  hasMore: boolean;
  onOffsetChange: (offset: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.floor(offset / pageSize) + 1;

  return (
    // flex-wrap: on a narrow phone, the "Showing…" text + page-size select
    // (left) plus Previous/Page X of Y/Next (right) don't both fit on one
    // line — this is reused by every offset-paginated admin table, so a
    // fixed no-wrap row would break identically everywhere it's used.
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-3">
        <p>
          Showing {Math.min(offset + 1, total)}–{Math.min(offset + shownCount, total)} of {total}
        </p>
        <Label htmlFor={id} className="sr-only">
          Rows per page
        </Label>
        <Select
          id={id}
          className="h-9 w-28 rounded-md py-0 pl-3 pr-8 text-sm"
          options={PAGE_SIZE_LABELS}
          value={`${pageSize} / page`}
          onChange={(label) => onPageSizeChange(Number(label.split(" ")[0]))}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={offset === 0}
          onClick={() => onOffsetChange(Math.max(0, offset - pageSize))}
        >
          Previous
        </Button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={!hasMore}
          onClick={() => onOffsetChange(offset + pageSize)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
