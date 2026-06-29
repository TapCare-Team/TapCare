import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export const dynamic = "force-dynamic";

function getErrorMessage(error?: string | string[]) {
  const value = Array.isArray(error) ? error[0] : error;

  if (value === "google_not_configured") {
    return "Google sign-in is not configured yet.";
  }

  if (value === "google") {
    return "Google sign-in could not be verified. Please try again.";
  }

  if (value === "oauth_state") {
    return "Sign-in session expired. Please try again.";
  }

  if (value === "invalid") {
    return "Email or password is incorrect.";
  }

  return "";
}

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string | string[]; changed?: string | string[] };
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(defaultRouteForUser(currentUser));
  }

  const errorMessage = getErrorMessage(searchParams?.error);
  const passwordChanged = Array.isArray(searchParams?.changed)
    ? searchParams.changed.includes("1")
    : searchParams?.changed === "1";

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Access for officers, caregivers, and admins.
        </p>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
        {passwordChanged ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Password changed. Sign in again with your new password.
          </div>
        ) : null}

        <LoginForm />

        <div className="mt-5">
          <a
            href="/api/auth/google/start"
            className="flex w-full items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-panel"
          >
            Sign in with Google
          </a>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          New caregiver?{" "}
          <Link href="/signup" className="font-medium text-accent">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
