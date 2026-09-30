"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useRegisterMutation } from "../authApi";
import type { RegisterRequest } from "../authTypes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { DISTRICTS, AL_STREAMS } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2, User, Phone, MapPin, GraduationCap, Home, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { isNormalizedApiError } from "@/lib/api";
import { withEnrollIntent } from "@/lib/enrollIntent";

// 1. Define Validation Schema (Matches backend registerSchema + confirm password)
const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "Password must not exceed 72 UTF-8 bytes",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .regex(/^0\d{9}$/, "Invalid Sri Lankan phone number format (e.g., 0757451258)"),
    address: z.string().min(1, "Address is required"),
    district: z.enum(DISTRICTS, { message: "Please select a district" }),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    alStream: z.enum(AL_STREAMS, { message: "Please select an A/L stream" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// Shared styling to give inputs/selects the taller, more rounded, softer
// look (overrides the Input component's defaults via class-merging).
// pl-10 leaves room for the leading icon every field carries.
const inputClassName =
  "h-12 rounded-xl border border-zinc-200 bg-white pl-10 text-[#191919] placeholder:text-[#A1A1AA] focus-visible:outline-none focus-visible:border-[#191919]";

const fieldIconClassName = "absolute left-3 top-3.5 h-4 w-4 text-[#71717A] pointer-events-none";

// Select/DatePicker triggers keep their shared internal behavior (dropdown
// panel, calendar) but get the same zinc/black border+background as inputClassName.
const controlClassName =
  "h-12 rounded-xl border-zinc-200 bg-white text-[#191919] focus-visible:border-[#191919]";

/**
 * SignUpForm Component
 *
 * Handles user registration (all 10 required fields) with validation and
 * error feedback. Rendered on its own route (/sign-up) inside
 * AuthPageShell, which owns the shared centered layout/wordmark shared
 * with /sign-in and the rest of the auth route group.
 */
export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signInHref = withEnrollIntent("/sign-in", searchParams);
  const [registerUser, { isLoading }] = useRegisterMutation();

  // 2. Initialize Form
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      district: undefined,
      dateOfBirth: "",
      alStream: undefined,
    },
  });

  // 3. Handle Submit
  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const payload: RegisterRequest = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phone: values.phone,
        address: values.address,
        district: values.district,
        dateOfBirth: values.dateOfBirth,
        alStream: values.alStream,
      };

      const createdUser = await registerUser(payload).unwrap();
      if (createdUser.verificationEmailSent === false) {
        toast.warning(
          "Your account was created, but email delivery failed. Use Resend code on the verification page.",
        );
      } else {
        toast.success("Account created! Check your email for a verification code.");
      }
      // Registering does not log the user in — they must verify their
      // email via OTP first, so we redirect explicitly rather than
      // relying on GuestGuard's isAuthenticated-driven redirect.
      router.push(withEnrollIntent(`/verify-email?email=${encodeURIComponent(values.email)}`, searchParams));
    } catch (error: unknown) {
      // Check if it's a normalized field error from our baseApi
      if (isNormalizedApiError(error) && error.field) {
        setError(error.field as keyof RegisterFormValues, {
          type: "server",
          message: error.message,
        });
      } else {
        toast.error(
          isNormalizedApiError(error)
            ? error.message
            : "Registration failed. Please try again.",
        );
      }
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-bold text-[#191919]">New to Foundry?</h2>
        <p className="font-alt text-[#71717A]">Start your journey with Foundry Academy</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* First Name */}
          <div className="space-y-2.5">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className={fieldIconClassName} />
              <Input
                id="firstName"
                type="text"
                placeholder="Jane"
                className={inputClassName}
                error={!!errors.firstName}
                disabled={isLoading}
                {...register("firstName")}
              />
            </div>
            {errors.firstName && (
              <p className="text-xs font-medium text-[#C91414]">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2.5">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className={fieldIconClassName} />
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className={inputClassName}
                error={!!errors.lastName}
                disabled={isLoading}
                {...register("lastName")}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs font-medium text-[#C91414]">{errors.lastName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2.5">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className={fieldIconClassName} />
              <Input
                id="phone"
                type="tel"
                placeholder="0771234567"
                className={inputClassName}
                error={!!errors.phone}
                disabled={isLoading}
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-xs font-medium text-[#C91414]">{errors.phone.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2.5">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="dateOfBirth"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={!!errors.dateOfBirth}
                  disabled={isLoading}
                  className={controlClassName}
                />
              )}
            />
            {errors.dateOfBirth && (
              <p className="text-xs font-medium text-[#C91414]">
                {errors.dateOfBirth.message}
              </p>
            )}
          </div>

          {/* District */}
          <div className="space-y-2.5">
            <Label htmlFor="district">District</Label>
            <Controller
              name="district"
              control={control}
              render={({ field }) => (
                <Select
                  id="district"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={DISTRICTS}
                  placeholder="Select district"
                  icon={MapPin}
                  error={!!errors.district}
                  disabled={isLoading}
                  className={controlClassName}
                />
              )}
            />
            {errors.district && (
              <p className="text-xs font-medium text-[#C91414]">{errors.district.message}</p>
            )}
          </div>

          {/* AL Stream */}
          <div className="space-y-2.5">
            <Label htmlFor="alStream">A/L Stream</Label>
            <Controller
              name="alStream"
              control={control}
              render={({ field }) => (
                <Select
                  id="alStream"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  options={AL_STREAMS}
                  placeholder="Select A/L stream"
                  icon={GraduationCap}
                  error={!!errors.alStream}
                  disabled={isLoading}
                  className={controlClassName}
                />
              )}
            />
            {errors.alStream && (
              <p className="text-xs font-medium text-[#C91414]">{errors.alStream.message}</p>
            )}
          </div>

          {/* Address (full width) */}
          <div className="space-y-2.5 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <div className="relative">
              <Home className={fieldIconClassName} />
              <Input
                id="address"
                type="text"
                placeholder="123 Main Street, Colombo"
                className={inputClassName}
                error={!!errors.address}
                disabled={isLoading}
                {...register("address")}
              />
            </div>
            {errors.address && (
              <p className="text-xs font-medium text-[#C91414]">{errors.address.message}</p>
            )}
          </div>

          {/* Email (full width) */}
          <div className="space-y-2.5 sm:col-span-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className={fieldIconClassName} />
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

          {/* Password */}
          <div className="space-y-2.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className={fieldIconClassName} />
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

          {/* Confirm Password */}
          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className={fieldIconClassName} />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={inputClassName}
                error={!!errors.confirmPassword}
                disabled={isLoading}
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-[#C91414]">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
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
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center font-alt text-sm text-[#71717A]">
          Already have an account?{" "}
          <Link href={signInHref} className="font-semibold text-[#191919] hover:text-[#E91717]">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
