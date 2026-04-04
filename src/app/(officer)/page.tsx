import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { FeatureSnapshotGrid } from "@/components/officer/feature-snapshot-grid";
import { FollowUpList } from "@/components/officer/follow-up-list";
import { getOfficerDashboardSummary } from "@/modules/households/services/household-analytics.service";

export default async function OfficerDashboardPage() {
  const summary = await getOfficerDashboardSummary("site-sgo-bedok");

  return (
    <AppShell
      title="Outreach Dashboard"
      subtitle="Who may need follow-up, and which NFC journeys are useful in the field."
      nav={[
        { href: "/", label: "Dashboard" },
        { href: "/households", label: "Households" },
        { href: "/follow-up", label: "Follow-up queue" },
        { href: "/caregiver", label: "Caregiver view" },
        { href: "/admin/analytics", label: "Admin analytics" }
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Possible outreach candidates"
          value={summary.followUpCandidates}
          hint="Explainable signals generated from recent event patterns."
        />
        <StatCard
          label="Activated households"
          value={summary.activatedHouseholds}
          hint="Households with at least one activated NFC artifact."
        />
        <StatCard
          label="Sudden inactivity"
          value={summary.inactiveCandidates}
          hint="Previously active households with 10 days of inactivity."
        />
      </div>

      <Panel eyebrow="Triage" title="Recent follow-up signals">
        <FollowUpList signals={summary.signals} />
      </Panel>

      <Panel eyebrow="Usefulness" title="Feature usefulness snapshot">
        <FeatureSnapshotGrid snapshots={summary.featureSnapshots} />
      </Panel>
    </AppShell>
  );
}
