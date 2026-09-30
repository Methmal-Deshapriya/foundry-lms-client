"use client";

import { useId, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api";
import { useCompleteUploadMutation, useCreateUploadIntentMutation } from "@/features/storage/storageApi";

const AVATAR_SIZE = 512;
const MAX_SOURCE_BYTES = 15 * 1_048_576; // what we'll accept from the picker before shrinking

/**
 * Shrinks any picked photo to a centred 512×512 WebP in the browser before
 * it's uploaded, so each avatar costs ~30–80 KB of storage no matter how big
 * the original was — and the server's 1 MB avatar cap is never an issue.
 */
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can't process images.");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob) throw new Error("Could not prepare the image.");
  return blob;
}

export function AvatarUpload({
  name,
  initials,
  previewUrl,
  disabled,
  onChange,
}: {
  name: string;
  initials: string;
  /** The currently chosen picture (saved or just uploaded). */
  previewUrl: string | null;
  disabled?: boolean;
  onChange: (objectId: string | null, previewUrl: string | null) => void;
}) {
  const inputId = useId();
  const [createIntent] = useCreateUploadIntentMutation();
  const [completeUpload] = useCompleteUploadMutation();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error("That image is too large — choose one under 15 MB.");
      return;
    }
    setUploading(true);
    try {
      const webp = await toSquareWebp(file);
      const intent = await createIntent({
        purpose: "STUDENT_AVATAR",
        fileName: "avatar.webp",
        contentType: "image/webp",
        sizeBytes: webp.size,
      }).unwrap();
      const response = await fetch(intent.upload.url, { method: intent.upload.method, headers: intent.upload.headers, body: webp });
      if (!response.ok) throw new Error(`Upload failed with HTTP ${response.status}.`);
      const ready = await completeUpload(intent.object.id).unwrap();
      // The old picture is deleted from storage by the server once the
      // profile is saved with this one — not here, so cancelling the dialog
      // never loses the current picture.
      onChange(ready.id, ready.publicUrl ?? URL.createObjectURL(webp));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not upload your picture."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-20 shrink-0 rounded-2xl border border-border">
        {previewUrl ? <AvatarImage src={previewUrl} alt={`${name}'s profile picture`} className="object-cover" /> : null}
        <AvatarFallback className="rounded-2xl bg-[#191919] text-xl font-bold text-white">{initials}</AvatarFallback>
      </Avatar>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm" disabled={disabled || uploading}>
            <label htmlFor={inputId} className="cursor-pointer">
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}
              {previewUrl ? "Change photo" : "Upload photo"}
            </label>
          </Button>
          {previewUrl ? (
            <Button type="button" variant="ghost" size="sm" disabled={disabled || uploading} onClick={() => onChange(null, null)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">Optional. A clear, friendly photo of you — it&apos;s cropped to a square.</p>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
      </div>
    </div>
  );
}
