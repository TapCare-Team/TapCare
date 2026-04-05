import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { FollowUpList } from "@/components/officer/follow-up-list";
import { requireUserWithRole } from "@/lib/auth";
import { getOfficerDashboardSummary } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function FollowUpQueuePage() {
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
  const summary = await getOfficerDashboardSummary(user.siteIds);

  return (
    <AppShell
      title="Follow-up Queue"
      subtitle="Review the recent reasons for follow-up, then decide whether outreach is needed."
      nav={[
        { href: "/", label: "Dashboard" },
        { href: "/households", label: "Households" }
      ]}
    >
      <Panel title="Households needing review" eyebrow="Follow-up">
        <FollowUpList signals={summary.signals} />
      </Panel>
    </AppShell>
  );
}
