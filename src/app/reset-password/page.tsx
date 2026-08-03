import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { SupportContact } from "@/components/shared/support-contact";

export const dynamic = "force-dynamic";

function getToken(searchParams?: { token?: string | string[] }) {
  return Array.isArray(searchParams?.token) ? searchParams.token[0] ?? "" : searchParams?.token ?? "";
}

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams?: { token?: string | string[] };
}) {
  const token = getToken(searchParams);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="mt-3 text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted">
          Use a strong password. Reset links expire and can only be used once.
        </p>

        {!token ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Reset link is missing or invalid.{" "}
            <Link href="/forgot-password" className="font-medium text-accent">
              Request a new link
            </Link>
            .
          </div>
        ) : (
          <ResetPasswordForm token={token} />
        )}

        <SupportContact className="mt-6 text-center text-sm text-muted" />
      </div>
    </div>
  );
}
