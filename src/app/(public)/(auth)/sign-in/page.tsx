import { AuthPageShell } from "@/components/auth/AuthPageShell";
import SignInForm from "@/features/auth/components/SignInForm";

export default function SignInPage() {
  return (
    <AuthPageShell>
      <SignInForm />
    </AuthPageShell>
  );
}
