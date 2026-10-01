"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import StudentOnlyRoute from "@/components/access/StudentOnlyRoute";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn, formatLKR } from "@/lib/utils";
import {
  useGetPublicExploreQuery,
  useLazyGetPublicExploreQuery,
  useGetPublicLearningServicesQuery,
} from "@/features/catalog/catalogApi";
import type {
  CourseLevel,
  PublicExploreCourseCard,
  PublicLearningService,
} from "@/features/catalog/catalogTypes";
import { CardGridSkeleton, LoadingStatus } from "@/components/ui/loading-skeletons";

const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: "OPEN", label: "Open enrollment" },
  { value: "FOUNDATION", label: "Foundation" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function FilterRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        active ? "bg-zinc-100 font-medium text-[#191919]" : "text-foreground hover:bg-muted",
      )}
    >
      {label}
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          active ? "border-[#191919] bg-[#191919] text-white" : "border-input",
        )}
      >
        {active ? <span className="h-1.5 w-1.5 rounded-sm bg-current" /> : null}
      </span>
    </button>
  );
}

// Top-level (not nested in ExplorePage) so its component identity is stable
// across renders — rendered twice, once inline for desktop and once inside
// the mobile Sheet, sharing the same state/handlers from the parent.
function FiltersPanel({
  hasFilters,
  onClearFilters,
  services,
  service,
  onServiceChange,
  level,
  onLevelChange,
  accessType,
  onAccessTypeChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  services: PublicLearningService[];
  service: string;
  onServiceChange: (slug: string) => void;
  level: CourseLevel | "";
  onLevelChange: (level: CourseLevel | "") => void;
  accessType: "FREE" | "PAID" | "";
  onAccessTypeChange: (accessType: "FREE" | "PAID" | "") => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between pb-1">
        <p className="font-semibold text-foreground">Filters</p>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Clear all
          </button>
        ) : null}
      </div>

      <FilterSection title="Service">
        <div className="space-y-0.5">
          <FilterRow label="All services" active={service === ""} onClick={() => onServiceChange("")} />
          {services.map((s) => (
            <FilterRow key={s.slug} label={s.title} active={service === s.slug} onClick={() => onServiceChange(s.slug)} />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Difficulty level">
        <div className="space-y-0.5">
          {LEVEL_OPTIONS.map((l) => (
            <FilterRow
              key={l.value}
              label={l.label}
              active={level === l.value}
              onClick={() => onLevelChange(level === l.value ? "" : l.value)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Access">
        <div className="flex gap-2">
          {(["FREE", "PAID"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAccessTypeChange(accessType === option ? "" : option)}
              className={cn(
                "h-9 flex-1 rounded-lg border text-sm font-medium transition-colors",
                accessType === option
                  ? "border-[#191919] bg-zinc-100 text-[#191919]"
                  : "border-input text-muted-foreground hover:bg-muted",
              )}
            >
              {option === "FREE" ? "Free" : "Paid"}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price range (LKR)">
        <div className="flex items-center gap-2">
          <Input
            aria-label="Minimum price"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(event) => onMinPriceChange(event.target.value)}
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            aria-label="Maximum price"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) => onMaxPriceChange(event.target.value)}
            className="h-9"
          />
        </div>
      </FilterSection>
    </>
  );
}

// The API returns at most 50 courses per request.
const PAGE_SIZE = 50;

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [service, setService] = useState("");
  const [level, setLevel] = useState<CourseLevel | "">("");
  const [accessType, setAccessType] = useState<"FREE" | "PAID" | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const debouncedMinPrice = useDebouncedValue(minPrice, 400);
  const debouncedMaxPrice = useDebouncedValue(maxPrice, 400);

  const { data: servicesData } = useGetPublicLearningServicesQuery();
  const filters = {
    q: debouncedQ || undefined,
    service: service || undefined,
    level: level || undefined,
    accessType: accessType || undefined,
    minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
    maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
  };
  const { data, isFetching, isError } = useGetPublicExploreQuery({ ...filters, limit: PAGE_SIZE });
  // Pages after the first, appended by "Load more" (code review M07-12).
  // Keyed on the filters, so changing a filter starts again from page 1.
  const filterKey = JSON.stringify(filters);
  const [more, setMore] = useState<{ key: string; courses: PublicExploreCourseCard[] }>({ key: "", courses: [] });
  const [fetchPage, { isFetching: isLoadingMore }] = useLazyGetPublicExploreQuery();
  const extraCourses = more.key === filterKey ? more.courses : [];

  const services = servicesData?.services ?? [];
  const courses = [...(data?.courses ?? []), ...extraCourses];
  const total = data?.pagination.total ?? 0;
  const canLoadMore = courses.length < total;
  const loadMore = async () => {
    const page = await fetchPage({ ...filters, limit: PAGE_SIZE, offset: courses.length }).unwrap();
    setMore({ key: filterKey, courses: [...extraCourses, ...page.courses] });
  };
  const hasFilters = Boolean(
    debouncedQ || service || level || accessType || debouncedMinPrice || debouncedMaxPrice,
  );

  const clearFilters = () => {
    setQ("");
    setService("");
    setLevel("");
    setAccessType("");
    setMinPrice("");
    setMaxPrice("");
  };

  const filtersPanelProps = {
    hasFilters,
    onClearFilters: clearFilters,
    services,
    service,
    onServiceChange: setService,
    level,
    onLevelChange: setLevel,
    accessType,
    onAccessTypeChange: setAccessType,
    minPrice,
    maxPrice,
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
  };

  return (
    <StudentOnlyRoute description="Admins manage the catalog directly instead of browsing it here.">
      {/* Breaks out of <main>'s own p-6 and height so this behaves like a
          real second sidebar — full height, flush against the primary
          sidebar, its own independent scroll — rather than a card that
          scrolls away with the page. Hidden below `md` in favor of the
          Sheet-based drawer below: at phone/tablet widths a second
          always-open sidebar (on top of the primary nav) leaves no usable
          room for the actual course grid. */}
      <div className="-m-6 flex h-[calc(100dvh-4rem)]">
        <aside className="catalog-scrollbar hidden w-72 shrink-0 flex-col overflow-y-auto border-r border-border bg-card p-5 md:flex">
          <FiltersPanel {...filtersPanelProps} />
        </aside>

        {/* side="right": the primary dashboard sidebar already opens/lives
            on the left, so a second drawer sliding in from that same edge
            would read as a conflicting/confusing duplicate of it — filters
            are a page-local, secondary panel, so they come from the
            opposite side. */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetContent side="right" className="catalog-scrollbar w-72 overflow-y-auto p-5 sm:max-w-72">
            <SheetHeader className="p-0 pb-1">
              <SheetTitle className="sr-only">Filters</SheetTitle>
            </SheetHeader>
            <FiltersPanel {...filtersPanelProps} />
          </SheetContent>
        </Sheet>

        {/* @container: the card grid below reflows off this pane's own
            width, not the viewport's — the pane's actual width is viewport
            minus the primary sidebar and (at md+) this filter aside, two
            fixed-width siblings a viewport breakpoint can't see. */}
        <div className="catalog-scrollbar @container min-w-0 flex-1 space-y-4 overflow-y-auto p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-base font-semibold text-foreground">Explore</h1>
              <p className="text-sm text-muted-foreground">
                Every course we run, across every service — filter to find yours.
              </p>
            </div>

            <div className="flex w-full max-w-sm flex-col items-end gap-1.5 sm:w-auto">
              <div className="flex w-full items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0 md:hidden"
                  onClick={() => setFiltersOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasFilters ? <span className="size-1.5 rounded-full bg-[#E91717]" aria-hidden="true" /> : null}
                </Button>
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    aria-label="Search courses"
                    value={q}
                    onChange={(event) => setQ(event.target.value)}
                    placeholder="Search courses"
                    className="h-10 pl-9"
                  />
                </div>
              </div>
              {!isFetching && !isError && courses.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {total} course{total === 1 ? "" : "s"} found
                </p>
              ) : null}
            </div>
          </div>

          {isFetching && courses.length === 0 ? (
            <>
              <LoadingStatus label="Loading courses…" />
              <CardGridSkeleton count={6} className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4" />
            </>
          ) : isError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-12 text-center">
              <h2 className="mb-2 text-2xl font-bold text-red-900">Something went wrong</h2>
              <p className="text-red-700">We couldn&apos;t load the catalog. Please try refreshing the page.</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-20 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-background">
                <BookOpen className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">No courses match your filters</h2>
              <p className="mx-auto max-w-md text-muted-foreground">
                {hasFilters ? "Try clearing a filter or two." : "We're preparing new courses. Please check back soon."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4">
                {courses.map((course) => (
                  <ExploreCourseCard key={course.id} course={course} />
                ))}
              </div>
              {canLoadMore ? (
                <div className="flex justify-center">
                  <Button variant="outline" disabled={isLoadingMore} onClick={() => void loadMore()}>
                    {isLoadingMore ? "Loading…" : `Show more (${total - courses.length} left)`}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </StudentOnlyRoute>
  );
}

function ExploreCourseCard({ course }: { course: PublicExploreCourseCard }) {
  return (
    <Link
      href={`/${course.serviceSlug}/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-lg"
    >
      <div className="relative flex aspect-video items-center justify-center overflow-hidden">
        <ThumbnailImage src={course.thumbnailUrl} alt="" label={course.title} className="h-full w-full object-cover" />
        <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
          {course.accessType === "FREE" ? "Free" : formatLKR(course.price)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="mb-1 line-clamp-1 text-base font-semibold text-foreground">{course.title}</h2>
        <p className="mb-3 line-clamp-1 text-sm text-muted-foreground">{course.summary}</p>

        {/* Tags left-aligned, "View course" pushed to the far right via
            ml-auto — falls to its own line if the tags wrap, rather than a
            separate divider-separated row. */}
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-[#191919]">{course.levelLabel}</span>
          {course.durationLabel && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {course.durationLabel}
            </span>
          )}
          {course.enrollmentStatus !== "OPEN" && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
              {course.enrollmentStatus === "COMING_SOON" ? "Coming soon" : "Reopening soon"}
            </span>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors group-hover:text-[#191919]">
            View course
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
