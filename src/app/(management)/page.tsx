import Link from "next/link";
import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { FollowUpReasonFilterBar } from "@/components/admin/follow-up-reason-filter";
import { HouseholdTriageList } from "@/components/admin/household-triage-list";
import { requireUserWithRole } from "@/lib/auth";
import { getAdminHouseholds } from "@/modules/households/services/household-analytics.service";
import { normalizeFollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";

export const dynamic = "force-dynamic";

export default async function AdminHouseholdDashboardPage({
  searchParams
}: {
  searchParams?: { reason?: string | string[] };
}) {
  await requireUserWithRole(["ADMIN"]);
  const selectedReason = normalizeFollowUpReasonFilter(
    Array.isArray(searchParams?.reason) ? searchParams?.reason[0] : searchParams?.reason
  );
  const households = await getAdminHouseholds();
  const filteredHouseholds =
    selectedReason === "all"
      ? households
      : households.filter((household) => household.signal?.signalType === selectedReason);

  return (
    <AppShell
      title="Households"
      subtitle="Prioritise households by follow-up reason, then open a household to review setup and activity."
      nav={[{ href: "/admin/analytics", label: "Analytics" }]}
    >
      <Panel
        eyebrow={`${filteredHouseholds.length} of ${households.length} households`}
        title="Household list"
        action={
          <Link
            href="/households/new"
            className="rounded-full border border-accent/30 bg-accentSoft px-6 py-3 text-base font-semibold text-accent shadow-sm transition hover:bg-white"
          >
            Add household
          </Link>
        }
      >
        <div className="mb-5">
          <FollowUpReasonFilterBar basePath="/" selectedReason={selectedReason} />
        </div>
        <HouseholdTriageList households={filteredHouseholds} />
      </Panel>
    </AppShell>
  );
}
