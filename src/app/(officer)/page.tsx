import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { FeatureSnapshotGrid } from "@/components/officer/feature-snapshot-grid";
import { FollowUpList } from "@/components/officer/follow-up-list";
import { requireUserWithRole } from "@/lib/auth";
import { getOfficerDashboardSummary } from "@/modules/households/services/household-analytics.service";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const user = await requireUserWithRole(["OFFICER", "ADMIN"]);
  const summary = await getOfficerDashboardSummary(user.siteIds);
  const nav = [
    { href: "/households", label: "Households" },
    { href: "/follow-up", label: "Follow-up queue" }
  ];

  if (user.role === "ADMIN") {
    nav.push(
      { href: "/caregiver", label: "Caregiver view" },
      { href: "/admin/analytics", label: "Admin analytics" }
    );
  }

  return (
    <AppShell
      title="Outreach Dashboard"
      subtitle="See which households may need follow-up and which stickers are being used."
      nav={nav}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Households that may need follow-up"
          value={summary.followUpCandidates}
          hint="Based on recent sticker activity patterns that may need a closer look."
        />
        <StatCard
          label="Households with active stickers"
          value={summary.activeStickerHouseholds}
          hint="Households that currently have at least one active sticker."
        />
        <StatCard
          label="Households with no recent activity"
          value={summary.inactiveCandidates}
          hint="Previously active households with no sticker activity in the last 10 days."
        />
      </div>

      <Panel eyebrow="Review and act" title="Recent follow-up reasons">
        <FollowUpList signals={summary.signals} />
      </Panel>

      <Panel eyebrow="Sticker usage" title="What people are using">
        <FeatureSnapshotGrid snapshots={summary.featureSnapshots} />
      </Panel>
    </AppShell>
  );
}
