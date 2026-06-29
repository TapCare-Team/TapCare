import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="mt-3 text-3xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your account email. If the account exists, TapCare will prepare a one-time reset link.
        </p>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
