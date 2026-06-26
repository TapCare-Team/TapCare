import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { FollowUpList } from "@/components/officer/follow-up-list";
import { FollowUpReasonFilterBar } from "@/components/officer/follow-up-reason-filter";
import { requireUserWithRole } from "@/lib/auth";
import { getSignalsForSites } from "@/modules/households/services/household-analytics.service";
import { filterSignalsByReason, normalizeFollowUpReasonFilter } from "@/modules/signals/domain/follow-up-filter";

export const dynamic = "force-dynamic";

export default async function FollowUpQueuePage({
  searchParams
}: {
  searchParams?: { reason?: string | string[] };
}) {
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
  const selectedReason = normalizeFollowUpReasonFilter(
    Array.isArray(searchParams?.reason) ? searchParams?.reason[0] : searchParams?.reason
  );
  const signals = await getSignalsForSites(user.siteIds);
  const filteredSignals = filterSignalsByReason(signals, selectedReason);

  return (
    <AppShell
      title="Follow-up Queue"
      subtitle="Review the recent reasons for follow-up, then decide whether outreach is needed."
      nav={[]}
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
