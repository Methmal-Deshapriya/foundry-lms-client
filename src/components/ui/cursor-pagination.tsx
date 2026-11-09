import { Button } from "@/components/ui/button";

export function CursorPagination({
  page,
  hasMore,
  isFetching,
  onPrevious,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  isFetching?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <nav
      aria-label="Table pagination"
      className="flex items-center justify-end gap-3"
    >
      <span className="text-sm text-muted-foreground">Page {page + 1}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page === 0 || isFetching}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!hasMore || isFetching}
        onClick={onNext}
      >
        Next
      </Button>
    </nav>
  );
}
