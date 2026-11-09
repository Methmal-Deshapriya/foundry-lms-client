import { LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

// Route-level fallback for public pages: the navbar plus a hero's worth of
// placeholder text — close enough to every public page's opening that the
// real content lands without a jump.
export default function PublicLoading() {
  return (
    <main className="min-h-dvh bg-[#FAFAFA]">
      <LoadingStatus label="Loading…" />
      <div className="border-b border-zinc-200 bg-white" aria-hidden="true">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 px-5 py-16 sm:py-24" aria-hidden="true">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-2/3 max-w-sm" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-12 w-44 rounded-full" />
          <Skeleton className="h-12 w-36 rounded-full" />
        </div>
      </div>
    </main>
  );
}
