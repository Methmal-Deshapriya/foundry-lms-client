"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyOtpMutation, useResendOtpMutation } from "../authApi";
import { OtpInput } from "@/components/ui/otp-input";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isNormalizedApiError } from "@/lib/api";
import { getDashboardPath } from "@/lib/access";
import { withEnrollIntent } from "@/lib/enrollIntent";

// 1. Define Validation Schema (Matches backend verifyOtpSchema)
const verifyOtpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter all 6 digits"),
});

type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * VerifyEmailForm Component
 *
 * Verifies a newly registered email with a 6-digit OTP. This is the
 * actual login moment for a freshly registered account — success sets
 * the auth cookie server-side and redirects to the dashboard.
 */
export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();
  const [cooldown, setCooldown] = useState(0);

  const {
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = async (values: VerifyOtpFormValues) => {
    if (!email) return;

    try {
      const verifiedUser = await verifyOtp({ email, code: values.code }).unwrap();
      toast.success("Email verified! Welcome to Foundry Academy.");
      router.replace(withEnrollIntent(getDashboardPath(verifiedUser.role), searchParams));
    } catch (error: unknown) {
      if (isNormalizedApiError(error) && error.field) {
        setError("code", {
          type: "server",
          message: error.message,
        });
      } else {
        toast.error(
          isNormalizedApiError(error)
            ? error.message
            : "Verification failed. Please try again.",
        );
      }
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    try {
      await resendOtp({ email }).unwrap();
      toast.success("A new code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error: unknown) {
      toast.error(
        isNormalizedApiError(error)
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  if (!email) {
    return (
      <div className="w-full max-w-md space-y-4 text-center">
        <h2 className="font-sans text-3xl font-bold text-[#191919]">Missing email</h2>
        <p className="font-alt text-[#71717A]">
          We couldn&apos;t tell which account to verify. Please sign up again.
        </p>
        <Link
          href="/sign-up"
          className="inline-block font-semibold text-[#191919] hover:text-[#E91717]"
        >
          Back to sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-bold text-[#191919]">Verify Your Email</h2>
        <p className="font-alt text-[#71717A]">
          Enter the 6-digit code sent to <span className="font-medium text-[#191919]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Code Field */}
        <div className="space-y-4">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={!!errors.code}
                disabled={isVerifying}
              />
            )}
          />
          {errors.code && (
            <p className="text-center text-xs font-medium text-[#C91414]">
              {errors.code.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#191919] font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify Email
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center font-alt text-sm text-[#71717A]">
          Didn&apos;t get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || cooldown > 0}
            className="font-semibold text-[#191919] hover:text-[#E91717] disabled:cursor-not-allowed disabled:text-[#A1A1AA]"
          >
            {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
          </button>
        </div>
      </form>
    </div>
  );
}
