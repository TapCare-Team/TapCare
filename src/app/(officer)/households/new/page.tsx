import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { HouseholdCreateForm } from "@/components/households/household-create-form";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { listCreatableSitesForUser } from "@/modules/households/services/household-management.service";

export const dynamic = "force-dynamic";

export default async function NewHouseholdPage() {
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
  const siteOptions = await listCreatableSitesForUser(user);

  return (
    <AppShell
      title="Add household"
      subtitle="Add a household within your assigned satellite office scope before setting up stickers."
      nav={[{ href: "/", label: "Household list", replace: true }]}
    >
      <Panel title="Household details" eyebrow="Officer setup">
        <p className="mb-5 text-sm text-muted">
          Officers can only add households within their assigned satellite office scope. Keep the record light:
          address first, then add stickers after creation.
        </p>
        {!isDatabaseConfigured() ? (
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Household creation requires <code>DATABASE_URL</code>. You can still browse the seeded dashboard in
            read-only mode.
          </div>
        ) : null}
        <HouseholdCreateForm siteOptions={siteOptions} canPersist={isDatabaseConfigured()} />
      </Panel>
    </AppShell>
  );
}
