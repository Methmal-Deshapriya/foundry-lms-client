import React, { Suspense } from "react";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const ResetPasswordPage = () => {
  return (
    <AuthPageShell>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
};

export default ResetPasswordPage;
