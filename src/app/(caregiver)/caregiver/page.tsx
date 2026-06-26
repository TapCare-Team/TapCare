import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { CaseloadTable } from "@/components/caregiver/caseload-table";
import { requireUserWithRole } from "@/lib/auth";
import { getHouseholdsByIds } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function CaregiverDashboardPage() {
  const user = await requireUserWithRole(["CAREGIVER", "ADMIN"]);
  const households = await getHouseholdsByIds(user.householdIds);

  return (
    <AppShell
      title="Households"
      subtitle="Open a household to review activity and manage sticker setup."
      nav={[]}
      homeHref="/caregiver"
    >
      <Panel title="Household list" eyebrow={`${households.length} assigned households`}>
        <CaseloadTable households={households} />
      </Panel>
    </AppShell>
  );
}
