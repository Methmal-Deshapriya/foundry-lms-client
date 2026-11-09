import React, { Suspense } from "react";
import VerifyEmailForm from "@/features/auth/components/VerifyEmailForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const VerifyEmailPage = () => {
  return (
    <AuthPageShell>
      <Suspense fallback={null}>
        <VerifyEmailForm />
      </Suspense>
    </AuthPageShell>
  );
};

export default VerifyEmailPage;
