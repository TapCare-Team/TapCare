import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export const dynamic = "force-dynamic";

function errorMessage(error?: string | string[]) {
  const value = Array.isArray(error) ? error[0] : error;

  if (value === "exists") {
    return "An account with this email already exists.";
  }

  if (value === "invalid") {
    return "Check your details and make sure your password follows the security requirements.";
  }

  return "";
}

export default async function SignupPage({
  searchParams
}: {
  searchParams?: { error?: string | string[] };
}) {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(defaultRouteForUser(currentUser));
  }

  const message = errorMessage(searchParams?.error);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="mt-3 text-3xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-muted">
          New accounts start as caregivers and only see households assigned to them.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <SignupForm />

        <div className="mt-5">
          <a
            href="/api/auth/google/start"
            className="flex w-full items-center justify-center rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-panel"
          >
            Sign up with Google
          </a>
          <p className="mt-2 text-center text-xs text-muted">
            Google signup does not require a TapCare password.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
