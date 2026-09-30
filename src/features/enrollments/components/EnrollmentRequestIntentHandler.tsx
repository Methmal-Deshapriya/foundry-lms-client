"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetPublicExploreQuery } from "@/features/catalog/catalogApi";
import { useCreateEnrollmentRequestMutation } from "@/features/enrollments/enrollmentRequestsApi";
import { useGetMyEnrollmentsQuery } from "@/features/enrollments/enrollmentsApi";
import { getAccessMessage } from "@/features/enrollments/components/EnrollmentCard";
import { getApiErrorMessage } from "@/lib/api";
import { formatLKR } from "@/lib/utils";
import { getWhatsAppEnrollUrl } from "@/lib/whatsapp";

const NEXT_STEPS = [
  "An admin contacts you on this number to confirm your seat and arrange payment.",
  "Once your payment is confirmed, the course appears in My Courses.",
  "Your classroom opens and you can start learning.",
];

/**
 * A visitor clicking "Enroll" on a PAID course — see the 2026-08-30
 * course-to-program-intake rename plan §8a. The course's currently open
 * intake is resolved server-side; this just captures a contact phone number
 * and submits the request. The ?requestCourse= query param stays in the URL
 * (and so keeps driving `courseId` at render time) until the dialog is
 * dismissed, rather than being stripped in an effect.
 *
 * Nothing is shown until the student's own enrollments have loaded: a
 * student already enrolled in this course (e.g. they clicked Enroll while
 * logged out, then signed in) is sent to their classroom instead of being
 * asked to request a seat they already have.
 */
export default function EnrollmentRequestIntentHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("requestCourse");
  const [contactPhone, setContactPhone] = useState("");
  const [createRequest, { isLoading }] = useCreateEnrollmentRequestMutation();
  const { data: myEnrollments, isLoading: isLoadingEnrollments } = useGetMyEnrollmentsQuery(
    { limit: 50 },
    { skip: !courseId },
  );
  // The public catalog is the one place that resolves a course id to its
  // title/price for a student; paid courses only, since that's all this
  // handler is ever for.
  const { data: paidCatalog } = useGetPublicExploreQuery({ accessType: "PAID", limit: 50 }, { skip: !courseId });
  const course = paidCatalog?.courses.find((entry) => entry.id === courseId);

  const existingEnrollment = courseId
    ? (myEnrollments?.enrollments ?? []).find(
        (enrollment) => enrollment.courseId === courseId && enrollment.status !== "CANCELLED",
      )
    : undefined;
  const redirectedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!courseId || !existingEnrollment || redirectedFor.current === courseId) return;
    redirectedFor.current = courseId;
    toast.info(`You're already enrolled in ${existingEnrollment.course.title}.`);
    // A locked enrollment (e.g. payment not yet confirmed) can't open its
    // classroom — My Courses shows why instead.
    router.replace(getAccessMessage(existingEnrollment) ? "/my-courses" : `/my-courses/${existingEnrollment.id}`);
  }, [courseId, existingEnrollment, router]);

  const close = () => {
    setContactPhone("");
    router.replace("/dashboard");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!courseId) return;
    try {
      await createRequest({ courseId, body: { contactPhone: contactPhone.trim() } }).unwrap();
      toast.success("Enrollment request sent — an admin will contact you shortly.");
      close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The enrollment request could not be sent."));
    }
  };

  const open = Boolean(courseId) && !isLoadingEnrollments && !existingEnrollment;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request enrollment</DialogTitle>
          <DialogDescription>
            Leave your phone number and an admin will reach out to arrange payment and confirm your seat.
          </DialogDescription>
        </DialogHeader>
        {course ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {course.serviceTitle}
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="font-semibold text-foreground">{course.title}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">{formatLKR(course.price)}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[course.levelLabel, course.durationLabel].filter(Boolean).join(" · ")}
            </p>
          </div>
        ) : null}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">What happens next</p>
          <ol className="space-y-1.5">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#191919] text-[11px] font-semibold text-white">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="enrollment-request-phone">Phone number</Label>
            <Input
              id="enrollment-request-phone"
              type="tel"
              required
              minLength={6}
              maxLength={30}
              autoFocus
              placeholder="0771234567"
              value={contactPhone}
              onChange={(event) => setContactPhone(event.target.value)}
            />
          </div>
          {course ? (
            <p className="text-xs text-muted-foreground">
              Prefer WhatsApp?{" "}
              <a
                href={getWhatsAppEnrollUrl(course.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:underline"
              >
                <MessageCircle className="size-3.5" aria-hidden="true" />
                Message us about this course
              </a>
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !contactPhone.trim()}
              className="bg-[#191919] bg-none text-white hover:bg-[#27272A]"
            >
              {isLoading ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
