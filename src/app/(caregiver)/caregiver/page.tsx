import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { CaseloadTable } from "@/components/caregiver/caseload-table";
import { getCurrentUser } from "@/lib/auth";
import { getOfficerHouseholds } from "@/modules/households/services/household-analytics.service";

export default async function CaregiverDashboardPage() {
  const user = await getCurrentUser("caregiver");
  const households = (await getOfficerHouseholds("site-sgo-bedok")).filter((household) =>
    user.householdIds.includes(household.id)
  );

  return (
    <AppShell
      title="Caregiver View"
      subtitle="Read-only caseload view for households you are responsible for."
      nav={[
        { href: "/", label: "Officer dashboard" },
        { href: "/caregiver", label: "Caregiver view" }
      ]}
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
          label="Activation gaps"
          value={households.filter((household) => household.artifacts.some((artifact) => artifact.activationState !== "ACTIVATED")).length}
          hint="Assigned households with unactivated or archived artifacts."
        />
      </div>

      <Panel title="Caseload" eyebrow="Assigned only">
        <CaseloadTable households={households} />
      </Panel>
    </AppShell>
  );
}
