"use client";

import { useEffect, useId, useState } from "react";
import { CheckCircle2, FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api";
import {
  type StoredObjectPurpose,
  type StoredObjectSummary,
  useCompleteUploadMutation,
  useCreateUploadIntentMutation,
} from "../storageApi";

function formatBytes(bytes: number) {
  if (bytes < 1_048_576) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1_048_576).toFixed(bytes < 10_485_760 ? 1 : 0)} MB`;
}

export function ObjectUploadField({
  label,
  purpose,
  accept,
  value,
  initialObject,
  disabled,
  helpText,
  onChange,
}: {
  label: string;
  purpose: StoredObjectPurpose;
  accept: string;
  value: string | null | undefined;
  initialObject?: StoredObjectSummary | null;
  disabled?: boolean;
  helpText?: string;
  onChange: (id: string | null, object: StoredObjectSummary | null) => void;
}) {
  const inputId = useId();
  const [object, setObject] = useState<StoredObjectSummary | null>(initialObject ?? null);
  const [createIntent] = useCreateUploadIntentMutation();
  const [completeUpload] = useCompleteUploadMutation();
  const [uploading, setUploading] = useState(false);
  const selected = value ? object ?? initialObject ?? null : null;

  useEffect(() => {
    setObject(initialObject ?? null);
  }, [initialObject]);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const intent = await createIntent({
        purpose,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }).unwrap();
      const response = await fetch(intent.upload.url, {
        method: intent.upload.method,
        headers: intent.upload.headers,
        body: file,
      });
      if (!response.ok) throw new Error(`R2 upload failed with HTTP ${response.status}.`);
      const ready = await completeUpload(intent.object.id).unwrap();
      setObject(ready);
      onChange(ready.id, ready);
      toast.success(`${file.name} uploaded`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not upload the file"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      {selected ? (
        <div className="flex min-h-10 items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{selected.fileName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(selected.sizeBytes)}</span>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled || uploading}
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={() => {
              setObject(null);
              onChange(null, null);
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
          {uploading ? "Uploading…" : "Choose file"}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled || uploading || Boolean(selected)}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = "";
          if (file) void upload(file);
        }}
      />
      {helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
    </div>
  );
}
