import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { FeatureSnapshotGrid } from "@/components/officer/feature-snapshot-grid";
import { requireUserWithRole } from "@/lib/auth";
import { getOfficerDashboardSummary } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const user = await requireUserWithRole(["ADMIN", "DEVELOPER"]);
  const summary = await getOfficerDashboardSummary(user.siteIds);

  return (
    <AppShell
      title="Admin Analytics"
      subtitle="System health and feature adoption are separated from officer triage."
      nav={[{ href: "/", label: "Officer dashboard" }]}
    >
      <Panel title="Feature adoption" eyebrow="Cross-cutting">
        <FeatureSnapshotGrid snapshots={summary.featureSnapshots} />
      </Panel>
    </AppShell>
  );
}
