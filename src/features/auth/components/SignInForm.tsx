"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginMutation } from "../authApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isNormalizedApiError } from "@/lib/api";
import { getDashboardPath } from "@/lib/access";
import { withEnrollIntent } from "@/lib/enrollIntent";

// 1. Define Validation Schema (Matches backend logic)
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Matches SignUpForm's input styling so both views look identical apart
// from the fields themselves.
const inputClassName =
  "h-12 rounded-xl border border-zinc-200 bg-white pl-10 text-[#191919] placeholder:text-[#A1A1AA] focus-visible:outline-none focus-visible:border-[#191919]";

/**
 * SignInForm Component
 *
 * Handles user login with validation and error feedback. Rendered on its
 * own route (/sign-in) inside AuthPageShell, which owns the shared
 * centered layout/wordmark shared with /sign-up and the rest of the auth
 * route group.
 */
export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signUpHref = withEnrollIntent("/sign-up", searchParams);
  const [login, { isLoading }] = useLoginMutation();

  // 2. Initialize Form
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 3. Handle Submit
  const onSubmit = async (data: LoginFormValues) => {
    try {
      const result = await login(data).unwrap();
      if ("requiresMfa" in result) {
        toast.success("Check your administrator email for a login code.");
        router.push(
          withEnrollIntent(`/verify-login?challenge=${encodeURIComponent(result.challengeId)}`, searchParams),
        );
        return;
      }
      toast.success("Welcome back to Foundry Academy!");
      router.replace(withEnrollIntent(getDashboardPath(result.role), searchParams));
    } catch (error: unknown) {
      if (isNormalizedApiError(error) && error.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Please verify your email before logging in.");
        router.push(withEnrollIntent(`/verify-email?email=${encodeURIComponent(data.email)}`, searchParams));
        return;
      }
      // Check if it's a normalized field error from our baseApi
      if (isNormalizedApiError(error) && error.field) {
        setError(error.field as keyof LoginFormValues, {
          type: "server",
          message: error.message,
        });
      } else {
        toast.error(
          isNormalizedApiError(error)
            ? error.message
            : "Login failed. Please try again.",
        );
      }
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-bold text-[#191919]">Sign In</h2>
        <p className="font-alt text-[#71717A]">Access your learning dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-[#71717A]" />
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

        {/* Password Field */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="font-alt text-xs font-medium text-[#71717A] hover:text-[#191919]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-[#71717A]" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className={inputClassName}
              error={!!errors.password}
              disabled={isLoading}
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-[#C91414]">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#191919] font-alt text-sm font-semibold text-white transition-colors hover:bg-[#27272A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center font-alt text-sm text-[#71717A]">
          Don&apos;t have an account?{" "}
          <Link href={signUpHref} className="font-semibold text-[#191919] hover:text-[#E91717]">
            Sign up for free
          </Link>
        </div>
      </form>
    </div>
  );
}
