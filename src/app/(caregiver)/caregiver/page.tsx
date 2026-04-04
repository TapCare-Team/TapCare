import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { CaseloadTable } from "@/components/caregiver/caseload-table";
import { getCurrentUser } from "@/lib/auth";
import { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function CaregiverDashboardPage() {
  const user = await getCurrentUser("caregiver");
  const households = (await getOfficerHouseholds("site-sgo-bedok")).filter((household) =>
    user.householdIds.includes(household.id)
  );

  return (
    <AppShell
      title="Caregiver View"
      subtitle="Read-only caseload view for households you are responsible for."
      nav={[]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Assigned households"
          value={households.length}
          hint="Only households with an active assignment to this caregiver."
        />
        <StatCard
          label="Households with signals"
          value={households.filter((household) => household.signal).length}
          hint="Read-only visibility into existing follow-up signals."
        />
        <StatCard
          label="Disabled critical stickers"
          value={
            households.filter((household) =>
              household.stickers.some(
                (sticker) =>
                  sticker.isCritical && sticker.status === "DISABLED"
              )
            ).length
          }
          hint="Assigned households missing an active emergency or help-profile sticker."
        />
      </div>

      <Panel title="Caseload" eyebrow="Assigned only">
        <CaseloadTable households={households} />
      </Panel>
    </AppShell>
  );
}
