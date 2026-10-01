"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import { useSelfEnrollCourseMutation } from "@/features/catalog/catalogApi";
import { getApiErrorMessage } from "@/lib/api";

/**
 * A student arriving with ?enrollCourse=<open intake id> (from "Start
 * learning" on a FREE course, carried through sign-in/up; see
 * enrollIntent). They confirm before anything happens: a link shared in a
 * group chat must not add a course to someone's account just by being
 * opened. The paid-course equivalent is EnrollmentRequestIntentHandler.
 */
export default function EnrollmentIntentHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intakeId = searchParams.get("enrollCourse");
  const [selfEnroll, { isLoading }] = useSelfEnrollCourseMutation();

  const close = () => router.replace("/dashboard");

  const confirm = async () => {
    if (!intakeId) return;
    try {
      const enrollment = await selfEnroll(intakeId).unwrap();
      toast.success("The free course is ready in My Courses.");
      router.replace(`/my-courses/${enrollment.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The free course could not be added."));
      router.replace("/my-courses");
    }
  };

  return (
    <Dialog open={Boolean(intakeId)} onOpenChange={(isOpen) => !isOpen && !isLoading && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add this course to My Courses?</DialogTitle>
          <DialogDescription>
            The free course you chose will be added to My Courses so you can start learning right away.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isLoading} onClick={close}>
            Not now
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={confirm}
            className="bg-[#191919] bg-none text-white hover:bg-[#27272A]"
          >
            {isLoading ? "Adding…" : "Add course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
