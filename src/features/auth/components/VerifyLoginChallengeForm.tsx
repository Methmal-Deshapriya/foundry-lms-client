"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { isNormalizedApiError } from "@/lib/api";
import { useVerifyLoginChallengeMutation } from "../authApi";

function ChallengeDeadEnd({ title, message }: { title: string; message: string }) {
  return (
    <div className="w-full max-w-md space-y-4 text-center">
      <h2 className="font-sans text-3xl font-bold text-[#0E1116]">{title}</h2>
      <p className="font-alt text-[#5B6472]">{message}</p>
      <Link
        href="/?slide=auth&authView=sign-in"
        className="inline-block font-semibold text-primary hover:text-primary/80"
      >
        Back to sign in
      </Link>
    </div>
  );
}

const verifyLoginSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter all 6 digits"),
});

type VerifyLoginFormValues = z.infer<typeof verifyLoginSchema>;

export default function VerifyLoginChallengeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get("challenge") ?? "";
  const enrollmentCourseId = searchParams.get("enrollCourse");
  const [verify, { isLoading }] = useVerifyLoginChallengeMutation();
  const [expiredMessage, setExpiredMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyLoginFormValues>({
    resolver: zodResolver(verifyLoginSchema),
    defaultValues: { code: "" },
  });

  const submit = async ({ code }: VerifyLoginFormValues) => {
    try {
      await verify({ challengeId, code }).unwrap();
      toast.success("Administrator login verified.");
      const intent = enrollmentCourseId
        ? `?enrollCourse=${encodeURIComponent(enrollmentCourseId)}`
        : "";
      // This challenge only ever exists for admin/super-admin logins (see
      // SignInForm's requiresMfa branch), so the target is always the
      // admin dashboard — no role check needed.
      router.replace(`/admin/dashboard${intent}`);
    } catch (error: unknown) {
      const message = isNormalizedApiError(error)
        ? error.message
        : "The login code could not be verified.";
      if (isNormalizedApiError(error) && error.field === "challengeId") {
        // The challenge itself is invalid/expired/already used — no amount
        // of retrying the code can succeed, so send them back to sign in
        // instead of leaving a doomed OTP form on screen.
        setExpiredMessage(message);
      } else if (isNormalizedApiError(error) && error.field === "code") {
        setError("code", { type: "server", message });
      } else {
        toast.error(message);
      }
    }
  };

  if (!challengeId) {
    return (
      <ChallengeDeadEnd
        title="Missing login challenge"
        message="This administrator verification link is incomplete. Please sign in again to request a new code."
      />
    );
  }

  if (expiredMessage) {
    return <ChallengeDeadEnd title="Login challenge expired" message={expiredMessage} />;
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="space-y-1">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Administrator security
        </div>
        <h2 className="font-sans text-3xl font-bold text-[#0E1116]">
          Verify Administrator Login
        </h2>
        <p className="font-alt text-[#5B6472]">
          Enter the 6-digit security code sent to your administrator email.
        </p>
      </div>

      <form className="space-y-3" onSubmit={handleSubmit(submit)}>
        <div className="space-y-4">
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <OtpInput
                id="login-code"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(errors.code)}
                disabled={isLoading}
              />
            )}
          />
          {errors.code ? (
            <p className="text-center text-xs font-medium text-red-500" role="alert">
              {errors.code.message}
            </p>
          ) : null}
        </div>

        <Button
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-blue-600 to-indigo-500 text-white hover:opacity-90"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Verifying...
            </>
          ) : (
            <>
              Verify Administrator Login
              <ArrowRight className="size-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

