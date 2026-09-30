"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSelfEnrollCourseMutation } from "@/features/catalog/catalogApi";
import { getApiErrorMessage } from "@/lib/api";

export default function EnrollmentIntentHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("enrollCourse");
  const handledCourseId = useRef<string | null>(null);
  const [selfEnroll] = useSelfEnrollCourseMutation();

  useEffect(() => {
    if (!courseId || handledCourseId.current === courseId) return;
    handledCourseId.current = courseId;

    void selfEnroll(courseId)
      .unwrap()
      .then((enrollment) => {
        toast.success("The free course is ready in My Courses.");
        router.replace(`/my-courses/${enrollment.id}`);
      })
      .catch((error) => {
        toast.error(
          getApiErrorMessage(error, "The free course could not be added."),
        );
        router.replace("/my-courses");
      });
  }, [courseId, router, selfEnroll]);

  if (!courseId) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-[#191919]" />
      Adding your free course to My Courses...
    </div>
  );
}
