import React from "react";
import ForgotPasswordForm from "@/features/auth/components/ForgotPasswordForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

const ForgotPasswordPage = () => {
  return (
    <AuthPageShell>
      <ForgotPasswordForm />
    </AuthPageShell>
  );
};

export default ForgotPasswordPage;
