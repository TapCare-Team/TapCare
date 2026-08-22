import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { SupportContact } from "@/components/shared/support-contact";
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
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
      <section className="w-full max-w-sm">
        <Link href="/" className="block text-center text-sm font-semibold uppercase tracking-[0.28em] text-accent">TapCare</Link>
        <h1 className="mt-10 text-center text-4xl font-semibold tracking-normal text-ink">Create an account</h1>
        <p className="mt-3 text-center text-sm text-muted">
          New accounts start as caregivers and only see households assigned to them.
        </p>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        ) : null}

        <SignupForm />

        <div className="mt-5">
          <a
            href="/api/auth/google/start"
            className="flex w-full items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-black/25 hover:bg-panel"
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

        <SupportContact className="mt-4 text-center text-sm text-muted" />
      </section>
    </main>
  );
}
