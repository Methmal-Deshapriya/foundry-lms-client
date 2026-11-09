"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isNormalizedApiError } from "@/lib/api";
import { useChangePasswordMutation } from "../authApi";

// Mirrors the server's changePasswordSchema, plus the confirm field.
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .refine((value) => new TextEncoder().encode(value).length <= 72, "Password must not exceed 72 UTF-8 bytes"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

const fieldIconClassName = "absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none";
const inputClassName = "h-11 rounded-lg border-input bg-background pl-10";

const FIELDS = [
  { name: "currentPassword", label: "Current password", icon: Lock, autoComplete: "current-password" },
  { name: "newPassword", label: "New password", icon: KeyRound, autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirm new password", icon: KeyRound, autoComplete: "new-password" },
] as const;

/**
 * Changes the signed-in user's password. The server ends every other
 * session and gives this browser a fresh cookie, so the user stays here.
 */
export default function ChangePasswordForm() {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword }).unwrap();
      toast.success("Password changed. Other devices have been signed out.");
      reset();
    } catch (error: unknown) {
      if (isNormalizedApiError(error) && (error.field === "currentPassword" || error.field === "newPassword")) {
        setError(error.field, { type: "server", message: error.message });
      } else {
        toast.error(isNormalizedApiError(error) ? error.message : "Could not change your password");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="@container grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-[14rem_1fr] lg:gap-8">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Password</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Changing it signs you out everywhere else, which also ends any session someone else may have.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-4 @md:grid-cols-2">
          {FIELDS.map(({ name, label, icon: Icon, autoComplete }) => (
            <div key={name} className={name === "currentPassword" ? "space-y-2 @md:col-span-2" : "space-y-2"}>
              <Label htmlFor={name}>{label}</Label>
              <div className="relative">
                <Icon className={fieldIconClassName} aria-hidden="true" />
                <Input
                  id={name}
                  type="password"
                  autoComplete={autoComplete}
                  className={inputClassName}
                  error={!!errors[name]}
                  disabled={isLoading}
                  {...register(name)}
                />
              </div>
              {errors[name] ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errors[name]?.message}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
        <Button type="submit" disabled={isLoading || !isDirty} className="bg-[#191919] bg-none text-white hover:bg-[#27272A]">
          {isLoading ? "Changing…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}
