import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { requireUser, userHasPassword } from "@/lib/auth";
import { defaultRouteForUser } from "@/modules/auth/services/session.service";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await requireUser();
  const hasPassword = await userHasPassword(user);

  return (
    <AppShell
      title="Change password"
      subtitle="Update your TapCare account password."
      nav={[{ href: defaultRouteForUser(user), label: "Back to workspace" }]}
      homeHref={defaultRouteForUser(user)}
    >
      <Panel title="Password" eyebrow="Account security">
        <p className="mb-5 text-sm text-muted">
          {hasPassword
            ? "After changing your password, TapCare signs you out of existing sessions and asks you to sign in again."
            : "Google-created accounts can set a TapCare password here if they want email/password sign-in too."}
        </p>
        <ChangePasswordForm hasPassword={hasPassword} />
      </Panel>
    </AppShell>
  );
}
