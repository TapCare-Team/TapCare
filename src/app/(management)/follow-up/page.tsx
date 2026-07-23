import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { FollowUpList } from "@/components/admin/follow-up-list";
import { FollowUpReasonFilterBar } from "@/components/admin/follow-up-reason-filter";
import { requireUserWithRole } from "@/lib/auth";
import { getSignalsForSites } from "@/modules/households/services/household-analytics.service";
import { filterSignalsByReason, normalizeFollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";

export const dynamic = "force-dynamic";

export default async function FollowUpQueuePage({
  searchParams
}: {
  searchParams?: { reason?: string | string[] };
}) {
  await requireUserWithRole(["ADMIN"]);
  const selectedReason = normalizeFollowUpReasonFilter(
    Array.isArray(searchParams?.reason) ? searchParams?.reason[0] : searchParams?.reason
  );
  const signals = await getSignalsForSites();
  const filteredSignals = filterSignalsByReason(signals, selectedReason);

  return (
    <AppShell
      title="Follow-up Queue"
      subtitle="Review the recent reasons for follow-up, then decide whether outreach is needed."
      nav={[{ href: "/", label: "Households" }, { href: "/admin/analytics", label: "Analytics" }]}
    >
      <Panel title="Households needing review" eyebrow="Follow-up">
        <div className="mb-5">
          <FollowUpReasonFilterBar basePath="/follow-up" selectedReason={selectedReason} />
        </div>
        <FollowUpList signals={filteredSignals} />
      </Panel>
    </AppShell>
  );
}
