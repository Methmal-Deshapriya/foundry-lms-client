"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginMutation } from "../authApi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isNormalizedApiError } from "@/lib/api";
import { getDashboardPath } from "@/lib/access";

// 1. Define Validation Schema (Matches backend logic)
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Matches SignUpForm's input styling so both views look identical apart
// from the fields themselves.
const inputClassName =
  "h-12 rounded-xl border-input bg-muted/50 pl-10 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary";

/**
 * SignInForm Component
 *
 * Handles user login with validation and error feedback. Rendered as the
 * swappable left-panel content inside AuthSlide, which owns the shared
 * two-column shell/branding panel — `onSignUpClick` swaps to the sign-up
 * view in place rather than navigating to a separate route.
 */
export default function SignInForm({ onSignUpClick }: { onSignUpClick: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollmentCourseId = searchParams.get("enrollCourse");
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
        const intent = enrollmentCourseId
          ? `&enrollCourse=${encodeURIComponent(enrollmentCourseId)}`
          : "";
        toast.success("Check your administrator email for a login code.");
        router.push(
          `/verify-login?challenge=${encodeURIComponent(result.challengeId)}${intent}`,
        );
        return;
      }
      toast.success("Welcome back to Foundry Academy!");
      const intent = enrollmentCourseId
        ? `?enrollCourse=${encodeURIComponent(enrollmentCourseId)}`
        : "";
      router.replace(`${getDashboardPath(result.role)}${intent}`);
    } catch (error: unknown) {
      if (isNormalizedApiError(error) && error.code === "EMAIL_NOT_VERIFIED") {
        toast.error("Please verify your email before logging in.");
        const intent = enrollmentCourseId
          ? `&enrollCourse=${encodeURIComponent(enrollmentCourseId)}`
          : "";
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}${intent}`);
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
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-bold text-[#0E1116]">Sign In</h2>
        <p className="font-alt text-[#5B6472]">Access your learning dashboard</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2.5">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
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
            <p className="text-xs font-medium text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
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
            <p className="text-xs font-medium text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 rounded-full bg-linear-to-r from-blue-600 to-indigo-500 hover:opacity-90 text-white mt-6 flex items-center justify-center gap-2"
          disabled={isLoading}
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
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSignUpClick}
            className="font-semibold text-primary hover:text-primary"
          >
            Sign up for free
          </button>
        </div>
      </form>
    </div>
  );
}
