"use client";

import { formatColomboDay } from "@/lib/dates";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowUpRight, Award, BadgeCheck, Briefcase, FolderCode, Github, Globe, Linkedin, MessageCircle, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingStatus } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import { PageSlide } from "@/components/marketing/catalog/PageSlide";
import { useGetPublicProfileQuery } from "@/features/profiles/profilesApi";
import type { PublicStudentProfile } from "@/features/profiles/profilesTypes";
import { getWhatsAppHireUrl } from "@/lib/whatsapp";

const subscribeNoop = () => () => {};

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "S"
  );
}

function SectionHeading({ icon: Icon, title, count }: { icon: typeof Award; title: string; count?: number }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-sans text-lg font-bold text-[#191919]">
      <Icon className="size-5" aria-hidden="true" />
      {title}
      {count !== undefined ? <span className="font-alt text-sm font-medium text-[#71717A] tabular-nums">({count})</span> : null}
    </h2>
  );
}

function ProfileLinks({ links }: { links: PublicStudentProfile["links"] }) {
  const items = [
    { href: links.linkedin, label: "LinkedIn", icon: Linkedin },
    { href: links.github, label: "GitHub", icon: Github },
    { href: links.portfolio, label: "Portfolio", icon: Globe },
  ].filter((item): item is { href: string; label: string; icon: typeof Linkedin } => Boolean(item.href));
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </a>
      ))}
    </div>
  );
}

/**
 * A student's public portfolio page — /students/<slug>. Only published
 * profiles (consented + at least one approved public project) exist here;
 * anything else is a 404, never "this profile is private". Every section
 * but the header is hidden when empty, so a student who's just starting
 * out still gets a complete-looking page.
 */
export function PublicStudentProfileView({ slug }: { slug: string }) {
  const { data, isLoading, isError } = useGetPublicProfileQuery(slug);
  const router = useRouter();
  // An old link the student has since changed moves to the current page
  // (code review M08-09). The server page redirects first; this covers a
  // client-side navigation.
  const redirectToSlug = data && "redirectToSlug" in data ? data.redirectToSlug : null;
  const profile = data && !("redirectToSlug" in data) ? data : undefined;
  useEffect(() => {
    if (redirectToSlug) router.replace(`/students/${redirectToSlug}`);
  }, [redirectToSlug, router]);
  // The share/hire link needs the site's own origin; empty during SSR.
  const origin = useSyncExternalStore(subscribeNoop, () => window.location.origin, () => "");

  if (isLoading || redirectToSlug) {
    return (
      <PageSlide background="#FAFAFA">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <LoadingStatus label="Loading profile…" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center" aria-hidden="true">
            <Skeleton className="size-28 rounded-3xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80 max-w-full" />
              <Skeleton className="h-10 w-40 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-hidden="true">
            <Skeleton className="aspect-video rounded-2xl" />
            <Skeleton className="aspect-video rounded-2xl" />
          </div>
        </div>
      </PageSlide>
    );
  }

  if (isError || !profile) {
    return (
      <PageSlide background="#FAFAFA">
        <div className="mx-auto max-w-lg py-20 text-center">
          <h1 className="font-sans text-2xl font-bold text-[#191919]">Profile not found</h1>
          <p className="font-alt mt-2 text-[#71717A]">This student profile doesn&apos;t exist, or isn&apos;t public yet.</p>
          <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-[#191919] px-6 font-alt text-sm font-semibold text-white hover:bg-[#27272A]">
            Back to home
          </Link>
        </div>
      </PageSlide>
    );
  }

  const firstName = profile.name.split(/\s+/)[0] || profile.name;
  const hireUrl = getWhatsAppHireUrl(profile.name, `${origin}/students/${profile.slug}`);

  return (
    <PageSlide background="#FAFAFA">
      <div className="mx-auto w-full max-w-5xl space-y-12">
        {/* Header */}
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
          <div className="relative h-28 bg-[#191919] sm:h-36">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }}
              aria-hidden="true"
            />
            <span className="absolute right-5 bottom-4 font-alt text-[10px] font-semibold tracking-widest text-white/60 uppercase">
              Foundry Academy · Student portfolio
            </span>
          </div>
          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <Avatar className="-mt-14 size-28 shrink-0 rounded-3xl ring-4 ring-white sm:-mt-16 sm:size-32">
                  {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt={profile.name} className="object-cover" /> : null}
                  <AvatarFallback className="rounded-3xl bg-[#191919] text-3xl font-bold text-white">{initialsOf(profile.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 sm:pb-1">
                  <h1 className="flex flex-wrap items-center gap-2 font-sans text-2xl font-bold tracking-tight text-[#191919] wrap-anywhere sm:text-3xl">
                    {profile.name}
                    <BadgeCheck className="size-6 text-[#191919]" aria-label="Verified Foundry Academy student" />
                  </h1>
                  {profile.headline ? <p className="font-alt mt-1 text-base text-[#3F3F46]">{profile.headline}</p> : null}
                  <p className="font-alt mt-1 text-xs text-[#71717A]">Learning with Foundry Academy since {format(new Date(profile.learningSince), "MMMM yyyy")}</p>
                </div>
              </div>
              <a
                href={hireUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#191919] px-6 font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A]"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Hire {firstName}
              </a>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 border-t border-zinc-100 pt-6 md:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                {profile.bio ? <p className="font-alt max-w-2xl text-sm leading-relaxed whitespace-pre-line text-[#3F3F46]">{profile.bio}</p> : null}
                {profile.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="rounded-full bg-zinc-100 font-medium text-[#191919]">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {profile.careerGoals.length > 0 ? (
                  <p className="font-alt flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#3F3F46]">
                    <Target className="size-4 shrink-0 text-[#E91717]" aria-hidden="true" />
                    <span className="font-semibold text-[#191919]">Working towards:</span>
                    {profile.careerGoals.join(" · ")}
                  </p>
                ) : null}
                <ProfileLinks links={profile.links} />
              </div>
              <dl className="flex gap-8 md:flex-col md:gap-4 md:border-l md:border-zinc-100 md:pl-8">
                <div>
                  <dt className="font-alt text-[11px] font-semibold tracking-wide text-[#71717A] uppercase">Projects</dt>
                  <dd className="font-sans text-2xl font-bold text-[#191919] tabular-nums">{profile.projects.length}</dd>
                </div>
                <div>
                  <dt className="font-alt text-[11px] font-semibold tracking-wide text-[#71717A] uppercase">Certificates</dt>
                  <dd className="font-sans text-2xl font-bold text-[#191919] tabular-nums">{profile.achievements.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section>
          <SectionHeading icon={FolderCode} title="Projects" count={profile.projects.length} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/showcase/${project.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg"
              >
                <div className="relative aspect-video overflow-hidden bg-[#191919]">
                  <ThumbnailImage
                    src={project.thumbnailUrl}
                    alt=""
                    label={project.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white text-[#191919] opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  {project.courseTitle ? (
                    <p className="font-alt text-[10px] font-semibold tracking-widest text-[#71717A] uppercase">{project.courseTitle}</p>
                  ) : null}
                  <h3 className="font-sans font-semibold text-[#191919]">{project.title}</h3>
                  {project.description ? <p className="font-alt line-clamp-2 text-sm text-[#71717A]">{project.description}</p> : null}
                  {project.technologies.length > 0 ? (
                    <div className="mt-auto flex flex-wrap gap-1 pt-2">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <span key={tech} className="rounded-full bg-zinc-100 px-2 py-0.5 font-alt text-[11px] text-[#3F3F46]">
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Achievements — certificates today; course badges will join this list. */}
        {profile.achievements.length > 0 ? (
          <section>
            <SectionHeading icon={Award} title="Achievements" count={profile.achievements.length} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.achievements.map((achievement) => (
                <Link
                  key={achievement.verificationCode}
                  href={`/certificates/verify/${achievement.verificationCode}`}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#191919] text-white">
                    <Award className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans font-semibold text-[#191919]">{achievement.title}</p>
                    <p className="font-alt text-xs text-[#71717A]">Certificate · Issued {formatColomboDay(achievement.issuedAt)}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-alt text-[11px] font-semibold text-emerald-700">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Verified
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Hire CTA */}
        <section className="rounded-3xl bg-[#191919] px-6 py-10 text-center sm:px-12">
          <Briefcase className="mx-auto size-8 text-white/80" aria-hidden="true" />
          <h2 className="mt-3 font-sans text-2xl font-bold tracking-tight text-white">Interested in working with {firstName}?</h2>
          <p className="font-alt mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Message Foundry Academy and we&apos;ll introduce you. We know our students&apos; work first-hand.
          </p>
          <a
            href={hireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:bg-zinc-200"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Contact us about {firstName}
          </a>
        </section>
      </div>
    </PageSlide>
  );
}
