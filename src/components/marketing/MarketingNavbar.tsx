"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/store/hooks";
import { selectAuthRole, selectIsAuthenticated } from "@/features/auth/authSelectors";
import { getDashboardPath } from "@/lib/access";
import { scrollToHash } from "@/lib/scrollToHash";

const COURSE_LINKS = [
  { label: "Bootcamps", href: "/bootcamps" },
  { label: "Pretech Courses", href: "/pretech-courses" },
  { label: "Free Learning", href: "/free-learning" },
];

/**
 * MarketingNavbar
 *
 * Sticky top nav for every public marketing page (home, service/course
 * pages, consultations, certificate verification). Carbon black + zinc
 * neutrals with brand red used only as the active-link marker and the
 * "Academy" wordmark — matching the LMS color system doc (red is a
 * signature accent, not a background/CTA color).
 */
export function MarketingNavbar() {
  const pathname = usePathname();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectAuthRole);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  const isHome = pathname === "/";
  const isCourses = COURSE_LINKS.some((link) => pathname.startsWith(link.href));
  const isConsultations = pathname === "/consultations";

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-1 border-b-2 border-transparent pb-0.5 transition-colors",
      active ? "border-[#191919] font-semibold text-[#191919]" : "text-[#71717A] hover:text-[#191919]",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-3 sm:px-6">
        <Link href="/" className="shrink-0 font-sans text-lg font-extrabold tracking-tight">
          <span className="text-[#191919]">Foundry</span> <span className="text-[#E91717]">Academy</span>
        </Link>

        <nav className="hidden items-center justify-center gap-6 font-alt text-sm font-medium lg:flex">
          <Link href="/" className={linkClass(isHome)}>
            Home
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(linkClass(isCourses), "outline-none")}
            >
              Courses <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {COURSE_LINKS.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>{link.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/#how-it-works" onClick={scrollToHash("how-it-works")} className={linkClass(false)}>
            How it works
          </Link>
          <Link href="/consultations" className={linkClass(isConsultations)}>
            Consultations
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <Link
              href={getDashboardPath(role)}
              className="inline-flex h-9 items-center rounded-full bg-[#191919] px-5 font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A]"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="font-alt text-sm font-medium text-[#71717A] transition-colors hover:text-[#191919]">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex h-9 items-center rounded-full bg-[#191919] px-5 font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A]"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="col-start-3 flex h-9 w-9 items-center justify-center justify-self-end rounded-lg text-[#191919] lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-white px-3 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 font-alt text-sm font-medium">
            <Link
              href="/"
              onClick={closeMobile}
              className={cn("rounded-lg px-3 py-2 hover:bg-zinc-100", isHome ? "font-semibold text-[#191919]" : "text-[#71717A] hover:text-[#191919]")}
            >
              Home
            </Link>
            {COURSE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="rounded-lg px-3 py-2 text-[#71717A] hover:bg-zinc-100 hover:text-[#191919]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#how-it-works"
              onClick={(event) => {
                scrollToHash("how-it-works")(event);
                closeMobile();
              }}
              className="rounded-lg px-3 py-2 text-[#71717A] hover:bg-zinc-100 hover:text-[#191919]"
            >
              How it works
            </Link>
            <Link
              href="/consultations"
              onClick={closeMobile}
              className={cn("rounded-lg px-3 py-2 hover:bg-zinc-100", isConsultations ? "font-semibold text-[#191919]" : "text-[#71717A] hover:text-[#191919]")}
            >
              Consultations
            </Link>
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-zinc-200 pt-3">
            {isAuthenticated ? (
              <Link
                href={getDashboardPath(role)}
                onClick={closeMobile}
                className="inline-flex h-10 items-center justify-center rounded-full bg-[#191919] font-alt text-sm font-semibold text-white"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={closeMobile}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 font-alt text-sm font-semibold text-[#191919]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={closeMobile}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-[#191919] font-alt text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
