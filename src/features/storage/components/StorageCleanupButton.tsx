"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api";
import { useRunStorageCleanupMutation, type StorageCleanupResult } from "../storageApi";

function formatBytes(bytes: number) {
  if (bytes < 1_048_576) return `${Math.max(0, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const PURPOSE_LABELS: Record<string, string> = {
  COURSE_THUMBNAIL: "Course image",
  COURSE_EXPLAINER_VIDEO_THUMBNAIL: "Video thumbnail",
  SESSION_RECORDING: "Session recording",
  SESSION_MATERIAL: "Session material",
  PROJECT_THUMBNAIL: "Project image",
  SERVICE_HERO: "Service hero",
  SERVICE_CARD: "Service card",
  STUDENT_AVATAR: "Profile photo",
  PAYMENT_PROOF: "Payment proof",
  PROMOTION_IMAGE: "Promotion image",
};

/**
 * Super admin: preview, then delete stored files nothing uses (unfinished
 * uploads and unused files older than a day). The same cleanup also runs
 * daily from GitHub Actions.
 */
export function StorageCleanupButton() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<StorageCleanupResult | null>(null);
  const [runCleanup, { isLoading }] = useRunStorageCleanupMutation();

  const loadPreview = async () => {
    setPreview(null);
    try {
      setPreview(await runCleanup({ dryRun: true }).unwrap());
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not check storage."));
      setOpen(false);
    }
  };

  const confirm = async () => {
    try {
      const result = await runCleanup({ dryRun: false }).unwrap();
      toast.success(`Removed ${result.deleted ?? 0} unused file${result.deleted === 1 ? "" : "s"} (${formatBytes(result.totalBytes)}).`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "The cleanup could not be completed."));
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void loadPreview();
        }}
        className="text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Clean up storage
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clean up storage</DialogTitle>
            <DialogDescription>
              Deletes files nothing in the system uses — uploads that were never finished, and replaced or abandoned files — once they&apos;re a day old.
              This runs automatically every night too.
            </DialogDescription>
          </DialogHeader>
          {!preview ? (
            <div className="space-y-2" aria-hidden="true">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : preview.count === 0 ? (
            <p className="rounded-md bg-muted/50 px-3 py-4 text-center text-sm text-muted-foreground">Nothing to clean up — storage is tidy.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {preview.count} file{preview.count === 1 ? "" : "s"} · {formatBytes(preview.totalBytes)}
                {preview.hasMore ? " (more will be cleaned on the next run)" : ""}
              </p>
              <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-md border border-border text-sm">
                {(preview.objects ?? []).map((object) => (
                  <li key={object.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">{object.fileName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {PURPOSE_LABELS[object.purpose] ?? object.purpose} · {object.status === "READY" ? "not used anywhere" : "upload never finished"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatBytes(object.sizeBytes)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Deleting is permanent.</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!preview || preview.count === 0 || isLoading}
              onClick={() => void confirm()}
              className="bg-linear-to-r from-red-600 to-rose-500 text-white"
            >
              {isLoading && preview ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              Delete unused files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
