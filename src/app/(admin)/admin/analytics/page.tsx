import { AppShell } from "@/components/shared/app-shell";
import { Panel } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { FeatureSnapshotGrid } from "@/components/officer/feature-snapshot-grid";
import { StickerPrivacyGuidance } from "@/components/setup/sticker-privacy-guidance";
import { requireUserWithRole } from "@/lib/auth";
import { getAdminAnalyticsSummary } from "@/modules/analytics/services/admin-analytics.service";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const user = await requireUserWithRole(["ADMIN", "DEVELOPER"]);
  const summary = await getAdminAnalyticsSummary(user);
  const failureEntries = Object.entries(summary.failurePatterns.byReason).sort(([, left], [, right]) => right - left);

  return (
    <AppShell
      title="Admin Analytics"
      subtitle="System health and feature adoption are separated from officer triage."
      nav={[{ href: "/", label: "Officer tools" }]}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Sites monitored"
          value={summary.siteCount}
          hint="Admin analytics cover all configured sites."
        />
        <StatCard
          label="Runtime events"
          value={summary.ingestionHealth.totalEvents}
          hint="Privacy-safe NFC and QR interactions."
        />
        <StatCard
          label="Last 24 hours"
          value={summary.ingestionHealth.eventsLast24h}
          hint="New events received by the runtime."
        />
        <StatCard
          label="Failure rate"
          value={`${Math.round(summary.ingestionHealth.failureRate * 100)}%`}
          hint="Failed runtime interactions only."
        />
      </div>

      <Panel title="Ingestion health" eyebrow="Developer diagnostics">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(summary.ingestionHealth.eventCounts).map(([eventType, count]) => (
            <div key={eventType} className="rounded-2xl border border-black/5 bg-white p-4">
              <p className="text-sm text-muted">{eventType.replaceAll("_", " ")}</p>
              <p className="mt-2 text-2xl font-semibold">{count}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Last received event:{" "}
          {summary.ingestionHealth.lastEventAt
            ? new Date(summary.ingestionHealth.lastEventAt).toLocaleString()
            : "No events yet"}
        </p>
      </Panel>

      <Panel title="Public sticker guardrails" eyebrow="Privacy and monitoring">
        <StickerPrivacyGuidance includeOperations />
      </Panel>

      <Panel title="Routing failures" eyebrow="Failure patterns">
        {failureEntries.length === 0 ? (
          <p className="text-sm text-muted">No failed runtime interactions have been recorded.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {failureEntries.map(([reason, count]) => (
              <div key={reason} className="rounded-2xl border border-black/5 bg-white p-4">
                <p className="text-sm text-muted">{reason.replaceAll("_", " ")}</p>
                <p className="mt-2 text-2xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Feature adoption" eyebrow="Cross-site">
        <FeatureSnapshotGrid snapshots={summary.featureAdoption} />
      </Panel>
    </AppShell>
  );
}
