"use client";

import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Infinity as InfinityIcon,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Repeat,
  Tag,
  Users,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { ThumbnailImage } from "@/components/ui/thumbnail-image";
import type { PublicCourseDetail } from "@/features/catalog/catalogTypes";
import { selectAuthRole, selectIsAuthenticated } from "@/features/auth/authSelectors";
import { useGetMyEnrollmentsQuery } from "@/features/enrollments/enrollmentsApi";
import { getAccessMessage } from "@/features/enrollments/components/EnrollmentCard";
import type { MyEnrollment } from "@/features/enrollments/enrollmentsTypes";
import { useAppSelector } from "@/store/hooks";
import { getWhatsAppEnrollUrl } from "@/lib/whatsapp";
import { CertificatePreview } from "./CertificatePreview";
import { CourseExplainerVideo } from "./CourseExplainerVideo";
import { PageSlide } from "./PageSlide";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(price: number, currency: string) {
  return `${currency} ${price.toLocaleString()}`;
}

const PRIMARY_CTA_CLASS =
  "flex h-12 w-full items-center justify-center rounded-full bg-[#191919] px-6 font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A]";

// The student's own enrollment in this course, if any — an active one wins
// over a completed one (a re-take), and a cancelled one doesn't count as
// "already enrolled" at all, so they can enroll again.
function findOwnEnrollment(enrollments: MyEnrollment[] | undefined, courseId: string) {
  const mine = (enrollments ?? []).filter((e) => e.courseId === courseId && e.status !== "CANCELLED");
  return mine.find((e) => e.status === "ACTIVE") ?? mine[0] ?? null;
}

export function ApiCourseDetail({ course }: { course: PublicCourseDetail }) {
  const { service, openIntake } = course;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isStudent = useAppSelector(selectAuthRole) === "STUDENT";
  const { data: myEnrollments } = useGetMyEnrollmentsQuery({ limit: 50 }, { skip: !isStudent });
  const ownEnrollment = findOwnEnrollment(myEnrollments?.enrollments, course.id);
  const ownAccessMessage = ownEnrollment ? getAccessMessage(ownEnrollment) : null;
  // A logged-in student goes straight to the dashboard, whose intent
  // handlers run the free-enroll / paid-request flows — routing them via
  // /sign-in would just bounce them to the dashboard and drop the intent.
  const intentBase = isStudent ? "/dashboard" : "/sign-in";
  const startDate = openIntake ? formatDate(openIntake.startDate) : null;
  const endDate = openIntake ? formatDate(openIntake.expectedEndDate) : null;

  return (
    <PageSlide background="#FAFAFA">
      <div className="w-full max-w-5xl mx-auto px-2">
        <Reveal>
          <p className="font-alt flex items-center gap-2 text-xs font-semibold tracking-widest text-[#71717A] uppercase mb-3">
            <span className="text-[#E91717]">—</span> {service.title}
          </p>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center text-[#191919] bg-zinc-100">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl font-bold text-[#191919] leading-tight tracking-tight">
              {course.title}
            </h1>
          </div>
          <p className="font-alt text-[#71717A] text-sm sm:text-base max-w-2xl">
            {course.summary}
          </p>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] lg:gap-10 lg:items-start">
          {/* Main content */}
          <Reveal className="min-w-0">
            <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              <ThumbnailImage src={course.thumbnailUrl} alt={course.title} label={course.title} className="h-full w-full object-cover" />
            </div>

            <div className="mb-8">
              <h2 className="font-sans font-semibold text-lg text-[#191919] mb-3">Overview</h2>
              <p className="font-alt text-[#71717A] leading-relaxed">{course.description}</p>
            </div>

            {course.targetAudience && (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[#191919]">
                  <Users className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-sans text-sm font-semibold text-[#191919]">Who this is for</p>
                  <p className="font-alt mt-1 text-sm text-[#71717A]">{course.targetAudience}</p>
                </div>
              </div>
            )}

            {course.explainerVideoUrl && (
              <div className="mb-8">
                <h2 className="font-sans font-semibold text-lg text-[#191919] mb-3">Watch the course overview</h2>
                <CourseExplainerVideo
                  videoUrl={course.explainerVideoUrl}
                  thumbnailUrl={course.explainerVideoThumbnailUrl}
                  title={course.title}
                />
              </div>
            )}

            <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8">
              <h2 className="font-sans font-semibold text-lg text-[#191919] mb-4">
                What you&apos;ll cover
              </h2>
              <ul className="space-y-3">
                {course.highlights.map((item) => (
                  <li key={item} className="flex gap-2.5 font-alt text-sm text-[#71717A]">
                    <Check className="h-4 w-4 text-[#191919] shrink-0 mt-0.5" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {course.whyPursueSteps.length > 0 && (
              <div className="mb-8">
                <h2 className="font-sans font-semibold text-lg text-[#191919] mb-4">Why pursue this course</h2>
                <div className="space-y-5">
                  {course.whyPursueSteps.map((step, index) => (
                    <div key={step.title} className="flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#191919] font-sans text-sm font-bold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-sans text-sm font-semibold text-[#191919]">{step.title}</p>
                        <p className="font-alt mt-1 text-sm text-[#71717A]">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {course.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="font-sans font-semibold text-lg text-[#191919] mb-3">
                  Skills you&apos;ll build
                </h2>
                <div className="flex flex-wrap gap-2">
                  {course.skills.map((skill) => (
                    <span
                      key={skill}
                      className="font-alt text-xs text-[#191919] bg-zinc-100 rounded-full px-3 py-1.5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {course.prerequisites.length > 0 && (
              <div className="mb-8">
                <h2 className="font-sans font-semibold text-lg text-[#191919] mb-2">Prerequisites</h2>
                <p className="font-alt text-sm text-[#71717A]">
                  {course.prerequisites.join(" · ")}
                </p>
              </div>
            )}

            {course.certificateEnabled && (
              <div className="mb-8">
                <h2 className="font-sans font-semibold text-lg text-[#191919] mb-4">What you&apos;ll earn</h2>
                <CertificatePreview courseTitle={course.title} />
              </div>
            )}
          </Reveal>

          {/* Enrollment summary card */}
          <Reveal className="lg:sticky lg:top-24">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6">
              <p className="font-sans text-2xl font-bold text-[#191919] mb-4">
                {course.accessType === "FREE" ? "Free" : formatPrice(course.price, course.currency)}
              </p>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2.5 font-alt text-sm text-[#71717A]">
                  <Tag className="h-4 w-4 text-[#191919] shrink-0" aria-hidden="true" />
                  {course.levelLabel}
                </li>
                {course.durationLabel && (
                  <li className="flex items-center gap-2.5 font-alt text-sm text-[#71717A]">
                    <Clock className="h-4 w-4 text-[#191919] shrink-0" aria-hidden="true" />
                    {course.durationLabel}
                  </li>
                )}
                <li className="flex items-center gap-2.5 font-alt text-sm text-[#71717A]">
                  {course.instanceKind === "EVERGREEN" ? (
                    <InfinityIcon className="h-4 w-4 text-[#191919] shrink-0" aria-hidden="true" />
                  ) : (
                    <Repeat className="h-4 w-4 text-[#191919] shrink-0" aria-hidden="true" />
                  )}
                  {course.instanceKind === "EVERGREEN" ? "Self-paced" : "Seasonal intake"}
                </li>
                {course.certificateEnabled && (
                  <li className="flex items-center gap-2.5 font-alt text-sm text-[#71717A]">
                    <Award className="h-4 w-4 text-[#191919] shrink-0" aria-hidden="true" />
                    Certificate included
                  </li>
                )}
                {(startDate || endDate) && (
                  <li className="flex items-center gap-2.5 font-alt text-sm text-[#71717A]">
                    <Calendar className="h-4 w-4 text-[#191919] shrink-0" aria-hidden="true" />
                    {startDate && endDate
                      ? `${startDate} – ${endDate}`
                      : (startDate ?? endDate)}
                  </li>
                )}
              </ul>

              {ownEnrollment ? (
                // Already enrolled: skip the enroll flow entirely. Straight
                // to the classroom when it's open to them; otherwise to My
                // Courses, whose card explains why it's still locked (e.g.
                // payment not yet confirmed).
                <div className="space-y-3">
                  <Link
                    href={ownAccessMessage ? "/my-courses" : `/my-courses/${ownEnrollment.id}`}
                    className={PRIMARY_CTA_CLASS}
                  >
                    {ownAccessMessage ? "View in My Courses" : "Go to classroom"}
                  </Link>
                  <p className="flex items-center justify-center gap-1.5 text-center font-alt text-xs text-[#71717A]">
                    {ownAccessMessage ? (
                      <>
                        <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {ownAccessMessage}
                      </>
                    ) : ownEnrollment.status === "COMPLETED" ? (
                      "You've completed this course."
                    ) : (
                      "You're enrolled in this course."
                    )}
                  </p>
                </div>
              ) : course.enrollmentStatus === "OPEN" && openIntake ? (
                <div className="space-y-3">
                  {course.accessType === "FREE" ? (
                    <Link href={`${intentBase}?enrollCourse=${openIntake.id}`} className={PRIMARY_CTA_CLASS}>
                      {isAuthenticated ? "Add to My Courses" : "Sign in and add to My Courses"}
                    </Link>
                  ) : (
                    <Link href={`${intentBase}?requestCourse=${course.id}`} className={PRIMARY_CTA_CLASS}>
                      Enroll now
                    </Link>
                  )}
                  {course.accessType === "PAID" && (
                    // A second path for students who'd rather arrange the
                    // seat directly over WhatsApp than wait for a call back.
                    <a
                      href={getWhatsAppEnrollUrl(course.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-6 font-alt text-sm font-semibold text-[#191919] transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Enroll on WhatsApp
                    </a>
                  )}
                  <p className="flex items-center justify-center gap-1.5 font-alt text-xs text-[#71717A]">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {openIntake.seatsRemaining === null
                      ? "Unlimited seats"
                      : openIntake.seatsRemaining > 0
                        ? `${openIntake.seatsRemaining} seat${openIntake.seatsRemaining === 1 ? "" : "s"} left`
                        : "Full"}
                  </p>
                </div>
              ) : (
                <div className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-zinc-100 px-6 font-alt text-sm font-semibold text-[#71717A]">
                  {course.enrollmentStatus === "COMING_SOON" ? (
                    <>
                      <Clock className="h-4 w-4" aria-hidden="true" /> Coming soon
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reopening soon
                    </>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </PageSlide>
  );
}
