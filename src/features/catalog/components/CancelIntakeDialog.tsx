"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONFIRM_WORD = "CANCEL";

/**
 * Cancelling an intake cancels every active enrollment in it and can't be
 * undone (a cancelled intake never reopens, so those enrollments can't be
 * reactivated). So it's confirmed with a typed word, and says how many
 * students it affects (code review M06-01).
 */
export function CancelIntakeDialog({
  intakeCode,
  enrollmentCount,
  open,
  isLoading,
  onOpenChange,
  onConfirm,
}: {
  intakeCode: string;
  enrollmentCount: number | null;
  open: boolean;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const close = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };
  const students =
    enrollmentCount == null ? "every student in it" : enrollmentCount === 1 ? "its 1 student" : `its ${enrollmentCount} students`;

  return (
    <AlertDialog open={open} onOpenChange={close}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel intake {intakeCode}?</AlertDialogTitle>
          <AlertDialogDescription>
            This cancels {students}&apos; enrollments and removes their classroom access immediately. A cancelled intake can&apos;t be
            reopened, so this can&apos;t be undone. Payments already recorded stay in the ledger.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cancel-intake-confirm">
            Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
          </Label>
          <Input id="cancel-intake-confirm" value={typed} autoComplete="off" onChange={(event) => setTyped(event.target.value)} />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep the intake</AlertDialogCancel>
          <AlertDialogAction
            disabled={typed.trim() !== CONFIRM_WORD || isLoading}
            onClick={() => {
              onConfirm();
              close(false);
            }}
            className="bg-linear-to-r from-red-600 to-rose-500 bg-none text-white hover:opacity-90"
          >
            Cancel intake
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
