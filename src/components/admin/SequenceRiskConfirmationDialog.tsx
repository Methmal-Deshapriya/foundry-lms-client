"use client";

import { useState } from "react";
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

export function SequenceRiskConfirmationDialog({
  open,
  description,
  details,
  isLoading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  description: string;
  details?: unknown;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");

  const conflicts =
    details && typeof details === "object" && "conflicts" in details
      ? (details as { conflicts?: { title?: string }[] }).conflicts ?? []
      : [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setConfirmation("");
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sequence risk detected</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {conflicts.length > 0 ? (
          <ul className="max-h-40 list-disc space-y-1 overflow-auto pl-5 text-sm text-muted-foreground">
            {conflicts.slice(0, 8).map((conflict, index) => (
              <li key={`${conflict.title ?? "session"}-${index}`}>
                {conflict.title ?? "Affected curriculum session"}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="sequence-confirmation">
            Type CONFIRM to continue with this exception
          </Label>
          <Input
            id="sequence-confirmation"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={confirmation !== "CONFIRM" || isLoading}
            onClick={() => {
              setConfirmation("");
              onConfirm();
            }}
          >
            Confirm exception
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
