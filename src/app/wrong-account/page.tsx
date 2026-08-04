import Link from "next/link";
import { requireUser } from "@/lib/auth";
import type { UserRole } from "@/modules/auth/domain/access";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export const dynamic = "force-dynamic";

function roleLabel(role: UserRole) {
  return role === "ADMIN" ? "admin" : "caregiver";
}

function accountLabel(role: UserRole) {
  return role === "ADMIN" ? "an admin account" : "a caregiver account";
}

function neededRoleLabel(value?: string | string[]) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const roles = rawValue
    ?.split(",")
    .map((role) => role.trim())
    .filter((role): role is UserRole => role === "ADMIN" || role === "CAREGIVER");

  if (!roles || roles.length === 0) {
    return "a different account type";
  }

  if (roles.length === 1) {
    return accountLabel(roles[0]);
  }

  return `${roles.map(roleLabel).join(" or ")} account`;
}

export default async function WrongAccountPage({
  searchParams
}: {
  searchParams?: { needed?: string | string[] };
}) {
  const user = await requireUser();

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-6 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-black/5 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-accent">TapCare</p>
        <h1 className="mt-5 text-3xl font-semibold tracking-normal text-ink">Wrong account type</h1>
        <p className="mt-4 text-sm leading-6 text-muted">
          You are currently signed in as {user.displayName} with {accountLabel(user.role)}. This page needs{" "}
          {neededRoleLabel(searchParams?.needed)}.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Log out and sign in with the correct account to continue.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Log out
            </button>
          </form>
          <Link
            href={defaultRouteForUser(user)}
            className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-panel"
          >
            Go to my workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
