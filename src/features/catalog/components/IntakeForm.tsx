"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api";
import {
  useCreateIntakeMutation,
  useGetIntakeDefaultsQuery,
  useUpdateIntakeMutation,
  type AdminCourse,
  type AdminIntake,
} from "../catalogApi";

/**
 * Creating an intake asks for almost nothing — nearly everything is
 * inherited from its Course or auto-suggested. See the 2026-08-30
 * course-to-program-intake rename plan §3a.
 */
export function IntakeForm({
  course,
  initial,
  onSuccess,
  onCancel,
}: {
  course: AdminCourse;
  initial?: AdminIntake;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const isFree = course.service.accessType === "FREE";
  const isEditing = Boolean(initial);
  const { data: defaults } = useGetIntakeDefaultsQuery(course.id, { skip: isEditing });
  const [intakeKey, setIntakeKey] = useState("");
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? "");
  const [expectedEndDate, setExpectedEndDate] = useState(initial?.expectedEndDate?.slice(0, 10) ?? "");
  const [timezone, setTimezone] = useState(initial?.timezone ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity?.toString() ?? "");
  const [create, createState] = useCreateIntakeMutation();
  const [update, updateState] = useUpdateIntakeMutation();

  // Auto-suggested defaults, shown until the admin types their own —
  // derived at render time rather than synced via an effect.
  const effectiveIntakeKey = intakeKey || defaults?.intakeKey || "";
  const effectiveTimezone = timezone || defaults?.timezone || "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (initial) {
        await update({
          id: initial.id,
          body: {
            startDate: isFree ? null : startDate,
            expectedEndDate: isFree ? null : expectedEndDate,
            timezone: effectiveTimezone,
            capacity: capacity ? Number(capacity) : null,
          },
        }).unwrap();
        toast.success("Intake setup updated");
      } else {
        await create({
          courseId: course.id,
          body: {
            intakeKey: effectiveIntakeKey,
            startDate: isFree ? null : startDate,
            expectedEndDate: isFree ? null : expectedEndDate,
            timezone: effectiveTimezone,
            capacity: capacity ? Number(capacity) : null,
          },
        }).unwrap();
        toast.success("Intake created as draft");
      }
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not save intake"));
    }
  };

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="rounded-md border bg-muted/30 p-4 text-sm">
        <p className="font-semibold">{course.title}</p>
        <p className="text-muted-foreground">
          Code prefix: {course.intakeCodePrefix}. The server builds the final
          intake code from this and the intake key below.
        </p>
        <p className="mt-2 text-muted-foreground">
          Inherited from {course.service.title}:{" "}
          {course.service.accessType.toLowerCase()} access,{" "}
          {course.service.courseMode.toLowerCase()} delivery,{" "}
          {course.service.enrollmentMode.toLowerCase()} enrollment.
        </p>
      </div>

      {!isEditing ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="intake-key">Intake key</Label>
            <Input
              id="intake-key"
              required
              value={effectiveIntakeKey}
              onChange={(event) => setIntakeKey(event.target.value.toUpperCase())}
              placeholder="2026-1"
            />
            <p className="text-xs text-muted-foreground">Auto-suggested — edit only if you want a specific label.</p>
          </div>
          <div className="space-y-2">
            <Label>Resulting code</Label>
            <Input readOnly value={`${course.intakeCodePrefix}-${effectiveIntakeKey || "…"}`} />
          </div>
        </div>
      ) : null}

      {course.service.courseMode === "SEASONAL" ? (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="intake-start">Start date</Label>
            <Input id="intake-start" required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intake-end">Expected end date</Label>
            <Input id="intake-end" required type="date" value={expectedEndDate} onChange={(event) => setExpectedEndDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intake-timezone">Timezone</Label>
            <Input id="intake-timezone" required value={effectiveTimezone} onChange={(event) => setTimezone(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intake-capacity">Capacity</Label>
            <Input
              id="intake-capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="Unlimited"
            />
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={createState.isLoading || updateState.isLoading}
          className="bg-[#191919] bg-none hover:bg-[#27272A]"
        >
          {initial ? "Save setup" : "Create intake"}
        </Button>
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  );
}
