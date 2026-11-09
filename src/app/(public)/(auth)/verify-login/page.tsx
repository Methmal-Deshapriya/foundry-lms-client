import { Suspense } from "react";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import VerifyLoginChallengeForm from "@/features/auth/components/VerifyLoginChallengeForm";

export default function VerifyLoginPage() {
  return (
    <AuthPageShell>
      <Suspense fallback={null}>
        <VerifyLoginChallengeForm />
      </Suspense>
    </AuthPageShell>
  );
}

