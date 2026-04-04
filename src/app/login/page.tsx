import { redirect } from "next/navigation";
import { listLoginUsers, getCurrentUser } from "@/lib/auth";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    redirect(defaultRouteForUser(currentUser));
  }

  const users = await listLoginUsers();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="w-full max-w-2xl rounded-3xl border border-black/5 bg-white p-8 shadow-panel">
        <p className="text-sm uppercase tracking-[0.3em] text-muted">TapCare</p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Minimal internal access for officers, caregivers, and admins.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {users.map((user) => (
            <form key={user.id} action="/api/auth/login" method="post" className="rounded-2xl border border-black/5 p-5">
              <input type="hidden" name="userId" value={user.id} />
              <p className="font-medium">{user.displayName}</p>
              <p className="mt-1 text-sm text-muted">{user.role}</p>
              <button
                type="submit"
                className="mt-4 rounded-full border border-accent/20 bg-accentSoft px-4 py-2 text-sm font-medium text-accent"
              >
                Continue as {user.displayName}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
