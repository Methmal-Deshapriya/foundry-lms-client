"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPasswordMutation } from "../authApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isNormalizedApiError } from "@/lib/api";

// 1. Define Validation Schema (Matches backend forgotPasswordSchema)
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// Matches SignUpForm/SignInForm's input styling so all auth forms look
// like one consistent family instead of a mix of card and non-card forms.
const inputClassName =
  "h-12 rounded-xl border border-zinc-200 bg-white pl-10 text-[#191919] placeholder:text-[#A1A1AA] focus-visible:outline-none focus-visible:border-[#191919]";

/**
 * ForgotPasswordForm Component
 *
 * Requests a password reset email. The server answers the same way for
 * registered and unknown addresses (so nobody can use this form to find out
 * who has an account), so the confirmation is worded "if it's registered".
 */
export default function ForgotPasswordForm() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(data).unwrap();
    } catch (error: unknown) {
      toast.error(
        isNormalizedApiError(error)
          ? error.message
          : "Something went wrong. Please try again.",
      );
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="font-sans text-3xl font-bold text-[#191919]">Check your email</h2>
        <p className="font-alt text-[#71717A]">
          If that email has an account, we&apos;ve sent it a link to reset your password. The link expires in 1 hour.
        </p>
        <Link
          href="/sign-in"
          className="inline-block font-semibold text-[#191919] hover:text-[#E91717]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-bold text-[#191919]">Forgot Password</h2>
        <p className="font-alt text-[#71717A]">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#71717A]" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className={inputClassName}
              error={!!errors.email}
              disabled={isLoading}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs font-medium text-[#C91414]">{errors.email.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#191919] font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending link...
            </>
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center font-alt text-sm text-[#71717A]">
          Remembered your password?{" "}
          <Link href="/sign-in" className="font-semibold text-[#191919] hover:text-[#E91717]">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
