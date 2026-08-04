import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { HouseholdCreateForm } from "@/components/households/household-create-form";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { listCreatableSitesForUser } from "@/modules/households/services/household-management.service";

export const dynamic = "force-dynamic";

export default async function NewHouseholdPage() {
  const user = await requireUserWithRole(["ADMIN"]);
  const siteOptions = await listCreatableSitesForUser(user);

  return (
    <AppShell
      title="Add household"
      subtitle="Add a household before setting up stickers."
      nav={[{ href: "/", label: "Household list", replace: true }]}
    >
      <Panel title="Household details" eyebrow="Admin setup">
        {!isDatabaseConfigured() ? (
          <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Household creation is currently read-only because the database is not connected. Please contact TapCare
            support.
          </div>
        ) : null}
        <HouseholdCreateForm siteOptions={siteOptions} canPersist={isDatabaseConfigured()} />
      </Panel>
    </AppShell>
  );
}
