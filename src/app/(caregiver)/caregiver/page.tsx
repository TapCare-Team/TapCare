import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { CaseloadTable } from "@/components/caregiver/caseload-table";
import { HouseholdAccessRequestForm } from "@/components/caregiver/household-access-request-form";
import { SupportContact } from "@/components/shared/support-contact";
import { requireUserWithRole } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db/database-mode";
import { getHouseholdsByIds } from "@/modules/households/services/household-analytics.service";
import {
  listHouseholdAccessRequestsForCaregiver,
  listRequestableSitesForCaregiver
} from "@/modules/households/services/household-access-request.service";

export const dynamic = "force-dynamic";

export default async function CaregiverDashboardPage() {
  const user = await requireUserWithRole(["CAREGIVER"]);
  const households = await getHouseholdsByIds(user.householdIds);
  const canRequest = user.role === "CAREGIVER" && isDatabaseConfigured();
  const [sites, requests] = canRequest
    ? await Promise.all([
        listRequestableSitesForCaregiver(user),
        listHouseholdAccessRequestsForCaregiver(user)
      ])
    : [[], []];

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

      {user.role === "CAREGIVER" ? (
        <Panel title="Request household access" eyebrow="Caregiver onboarding">
          <HouseholdAccessRequestForm
            sites={sites}
            initialRequests={requests}
            canRequest={canRequest}
          />
          <SupportContact className="mt-5 text-sm text-muted" />
        </Panel>
      ) : null}
    </AppShell>
  );
}
